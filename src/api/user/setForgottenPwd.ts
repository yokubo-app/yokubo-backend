import * as Boom from "boom";
import * as Hapi from "hapi";
import * as Joi from "joi";
import * as moment from "moment";
import * as zxcvbn from "zxcvbn";

import { Transaction } from "sequelize";
import Config from "../../Config";
import { AccessToken } from "../../models/AccessToken";
import { PwdResetToken } from "../../models/PwdResetToken";
import { RefreshToken } from "../../models/RefreshToken";
import { User } from "../../models/User";
import sequelize from "../../util/sequelize";
import { errorCodes } from "./_errorCodes";
import { TokenSchema } from "./_schema";

export const setForgottenPwd = [{
    method: "POST",
    path: "/api/v1/auth/setforgottenpwd",
    handler: setForgottenPwdHandler,
    config: {
        auth: false,
        description: "Set new password of a user using a valid PwdResetToken",
        tags: ["api", "post", "v1", "auth", "setforgottenpwd"],
        validate: {
            options: {
                abortEarly: false
            },
            payload: Joi.object().required().keys({
                token: Joi.string().guid().length(36).required(),
                newPwd: Joi.string().required()
            })
        },
        response: {
            schema: TokenSchema
        }
    }
}];

async function setForgottenPwdHandler(request: Hapi.Request, reply: Hapi.ResponseToolkit): Promise<any> {

    const { token, newPwd } = request.payload as any;

    // Error out if token does not exist
    const pwdResetToken = await PwdResetToken.find({
        where: {
            token,
            validUntil: {
                $gt: moment().subtract(Config.auth.tokenExpiresIn, "milliseconds").toDate()
            }
        }
    });
    if (!pwdResetToken) {
        throw Boom.notFound();
    }

    // Error out if new password is to weak
    const zxcvbnInfo = zxcvbn(newPwd);
    if (zxcvbnInfo.score < Config.auth.zxcvbnScore) {
        throw Boom.badRequest(errorCodes.PASSWORD_WEAK, {
            warning: zxcvbnInfo.feedback.warning,
            score: zxcvbnInfo.score
        });
    }

    // Error out if user does not exist anymore
    const user = await User.findById(pwdResetToken.UserUid);
    if (!user) {
        throw Boom.notFound();
    }

    return sequelize.transaction(async (transaction: Transaction) => {

        // Save new password
        await user.update({
            password: await User.hashPassword(newPwd)
        });

        // Destroy PwdResetToken
        await pwdResetToken.destroy();

        // Create tokens
        const [refreshToken, accessToken] = await Promise.all([
            await user.$create("RefreshToken", {}) as RefreshToken,
            await user.$create("AccessToken", {
                validUntil: moment().add(Config.auth.tokenExpiresIn, "milliseconds").toDate()
            }) as AccessToken
        ]);

        return {
            tokenType: "Bearer",
            refreshToken: refreshToken.token,
            accessToken: accessToken.token,
            expiresIn: Config.auth.tokenExpiresIn
        };

    });

}
