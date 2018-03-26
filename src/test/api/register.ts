import { expect } from "chai";
import * as path from "path";
import { purify } from "../purify";

import chaiRequest from "../chaiRequest";

describe("POST /v1/auth/register", () => {

    const SNAPSHOT_FILE = path.join(__dirname, "../../../../snapshots/", `register.snap`);

    const registrationPayload = {
        username: "new-user@test.com",
        password: "adsdhas9d8a39h9",
        name: "New User"
    };

    it("should register user", async () => {

        const response = await chaiRequest("POST", "/v1/auth/register").send(registrationPayload);
        expect(response.status).to.be.equal(200);

        const preparedSnapshot = purify(response.body, ["refreshToken", "accessToken"]);
        expect(preparedSnapshot).to.matchSnapshot(SNAPSHOT_FILE, "registration");

    });

});
