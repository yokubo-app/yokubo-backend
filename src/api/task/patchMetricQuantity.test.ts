import { expect } from "chai";
import * as path from "path";

import { accessToken1, metricQuantity1, task1 } from "../../test/fixture";
import chaiRequest from "../../util/chaiRequest";
import { purify } from "../../util/purify";

describe("PATCH /api/v1/tasks/{taskUid}/quantities", () => {

    const SNAPSHOT_FILE = path.join(__dirname, "../../../../../snapshots/task.snap");

    it("should patch metric quantity", async () => {

        const payload = {
            quantity: 40
        };

        const res = await chaiRequest(
            "PATCH",
            `/api/v1/tasks/${task1.uid}/quantities/${metricQuantity1.uid}`,
            accessToken1.token
        ).send(payload);

        expect(res.status).to.be.equal(200);

        const preparedSnapshot = purify(res.body, ["createdAt"]);
        expect(preparedSnapshot).to.matchSnapshot(SNAPSHOT_FILE, "patchMetricQuantity");

    });

    it("should fail patching non existing task", async () => {

        const payload = {
            quantity: 40
        };

        const res = await chaiRequest(
            "PATCH",
            `/api/v1/tasks/${task1.uid}/quantities/445fd2fa-8860-45b0-ae23-0991c5fb38a0`,
            accessToken1.token
        ).send(payload);

        expect(res.status).to.be.equal(404);

        const preparedSnapshot = purify(res.body, []);
        expect(preparedSnapshot).to.matchSnapshot(SNAPSHOT_FILE, "patchNonExistingMetricQuantity");

    });

});
