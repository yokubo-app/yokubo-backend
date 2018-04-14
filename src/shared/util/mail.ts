import Config from "../Config";

const SparkPost = require("sparkpost");

const options = {
    endpoint: Config.mailing.endpoint
};
const client = new SparkPost(Config.mailing.apiKey, options);

export interface Recipient {
    address: string;
}

interface MailResult {
    results: {
        total_rejected_recipients: number;
        total_accepted_recipients: number;
        id: number;
    };
}

export async function sendMail(subject: string, html: string, recipients: Recipient[]): Promise<MailResult> {

    // Return stub if we are in test env and sending of mails is not set
    if (Config.env === "test" && !process.env.SEND_TEST_MAILS) {

        return Promise.resolve({
            results: {
                total_rejected_recipients: 0,
                total_accepted_recipients: recipients.length,
                id: 0
            }
        });

    }

    try {

        const res = await client.transmissions.send({
            options: {
                sandbox: false
            },
            content: {
                from: Config.mailing.from,
                subject,
                html
            },
            recipients
        });

        if (Config.env === "test") {
            await Promise.delay(1000); // Delay return so mail can be sent
        }

        return res;

    } catch (err) {

        // No logging of possible error as logger could try to send mail which may again produce error and so on
        // TODO: Use different channel to inform mailing is not possible

        return Promise.resolve({
            results: {
                total_rejected_recipients: recipients.length,
                total_accepted_recipients: 0,
                id: 0
            }
        });

    }

}
