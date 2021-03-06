import * as Boom from "boom";
import * as Hapi from "hapi";
import * as Joi from "joi";
import * as _ from "lodash";

import { Transaction } from "sequelize";
import { MetricQuantity } from "../../models/MetricQuantity";
import { Task } from "../../models/Task";
import { TaskItem } from "../../models/TaskItem";
import { TaskMetric } from "../../models/TaskMetric";
import sequelize from "../../util/sequelize";
import { FullTaskSchema } from "./_schema";

export const patchTask = [{
    method: "PATCH",
    path: "/api/v1/tasks/{taskUid}",
    handler: patchTaskHandler,
    config: {
        auth: {
            scope: ["default_user"]
        },
        description: "Patch task",
        tags: ["api", "patch", "v1", "task"],
        validate: {
            options: {
                abortEarly: false
            },
            payload: Joi.object().keys({
                name: Joi.string().optional(),
                metrics: Joi.array().items(
                    Joi.object().keys({
                        uid: Joi.string().optional(),
                        name: Joi.string().required(),
                        unit: Joi.string().required(),
                        action: Joi.string().valid("create", "delete", "patch")
                    }).optional()
                ).optional(),
                imageUid: Joi.string().optional()
            })
        },
        response: {
            schema: FullTaskSchema
        }
    }
}];

async function patchTaskHandler(request: Hapi.Request, reply: Hapi.ResponseToolkit): Promise<any> {

    const { metrics, imageUid, ...restPayload } = request.payload as any;

    const task = await Task.find({
        where: {
            uid: request.params.taskUid
        }
    });

    if (!task) {
        throw Boom.notFound();
    }

    const payload = _.extend({},
                             imageUid && imageUid !== null ? { ImageUid: imageUid } : null,
                             restPayload
    );

    return sequelize.transaction(async (transaction: Transaction) => {
        await task.update(payload);

        if (metrics) {
            for (const metric of metrics) {
                switch (metric.action) {
                    case "create":
                        const createTaskMetric = await TaskMetric.create({
                            name: metric.name,
                            unit: metric.unit,
                            TaskUid: task.uid
                        });
                        // Add quanitity of 0 to existing items
                        const taskItems = await task.$get("TaskItems") as TaskItem[];
                        await Promise.map(taskItems, taskItem => MetricQuantity.create({
                            quantity: 0,
                            TaskItemUid: taskItem.uid,
                            TaskMetricUid: createTaskMetric.uid
                        }));
                        break;
                    case "delete":
                        if (metric.uid) {
                            const deleteTaskMetric = await TaskMetric.find({
                                where: {
                                    uid: metric.uid
                                }
                            });
                            if (!deleteTaskMetric) {
                                throw Boom.notFound();
                            }
                            await deleteTaskMetric.destroy();
                            break;
                        } else {
                            throw Boom.badData();
                        }
                    case "patch":
                        if (metric.uid) {
                            const patchTaskMetric = await TaskMetric.find({
                                where: {
                                    uid: metric.uid
                                }
                            });
                            if (!patchTaskMetric) {
                                throw Boom.notFound();
                            }
                            await patchTaskMetric.update({
                                name: metric.name,
                                unit: metric.unit
                            });
                            break;
                        } else {
                            throw Boom.badData();
                        }
                    default:
                        throw Boom.badData();
                }
            }
        }

        return task.fullPublicJsonObject();
    });
}
