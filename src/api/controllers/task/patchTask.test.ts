import { expect } from "chai";
import * as path from "path";

import chaiRequest from "../../../test/chaiRequest";
import { uids } from "../../../test/fixture";
import { purify } from "../../../test/purify";

describe("PATCH /v1/task", function () {

    const SNAPSHOT_FILE = path.join(__dirname, "../../../../../snapshots/", `task.snap`);

    it("should patch task", async () => {

        const payload = {
            name: "Running",
            imageUid: uids.image1
        };

        const res = await chaiRequest("PATCH", `/v1/tasks/${uids.task1}`, uids.accessToken1)
            .send(payload);

        expect(res.status).to.be.equal(200);

        const preparedSnapshot = purify(res.body, ["createdAt", "period"]);
        expect(preparedSnapshot).to.matchSnapshot(SNAPSHOT_FILE, "patchTask");

    });

    it("should patch name of task", async () => {

        const payload = {
            name: "Running",
        };

        const res = await chaiRequest("PATCH", `/v1/tasks/${uids.task1}`, uids.accessToken1)
            .send(payload);

        expect(res.status).to.be.equal(200);

        const preparedSnapshot = purify(res.body, ["createdAt", "period"]);
        expect(preparedSnapshot).to.matchSnapshot(SNAPSHOT_FILE, "patchTaskName");

    });

    it("should patch image of task", async () => {

        const payload = {
            imageUid: uids.image1
        };

        const res = await chaiRequest("PATCH", `/v1/tasks/${uids.task1}`, uids.accessToken1)
            .send(payload);

        expect(res.status).to.be.equal(200);

        const preparedSnapshot = purify(res.body, ["createdAt", "period"]);
        expect(preparedSnapshot).to.matchSnapshot(SNAPSHOT_FILE, "patchTaskImage");

    });

    it("should fail patching non existing task", async () => {

        const payload = {
            name: "Running",
        };

        const path = "/v1/tasks/954f261d-cd52-4070-8e96-b942b4b44a6d";
        const res = await chaiRequest("PATCH", path, uids.accessToken1)
            .send(payload);

        expect(res.status).to.be.equal(404);
        expect(res.body).to.matchSnapshot(SNAPSHOT_FILE, "patchNonExistingTask");

    });

});
