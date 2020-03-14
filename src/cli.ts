#!/usr/bin/env node
'use strict';

import {SQS} from "aws-sdk";
import {SqsMoveWithAttrs} from "./sqs-move-with-attrs";

console.log("Move all messages with its attributes from one AWS SQS queue to another.");

const matchSqsUrl = (sqsUrl: string): boolean => {
    const sqsUrlRegex = /^https:\/\/sqs\.[\w-]+\.amazonaws\.com\/[\d]+\/.+$/;
    return sqsUrlRegex.test(sqsUrl)
};

let errorMessage = null;
if (process.argv.length != 4) {
    errorMessage = "Unexpected number of arguments.";
} else if (!matchSqsUrl(process.argv[2])) {
    errorMessage = "Invalid format of <source_SQS_URL>.";
} else if (!matchSqsUrl(process.argv[3])) {
    errorMessage = "Invalid format of <destination_SQS_URL>.";
}

if (errorMessage) {
    console.log("ERROR: %s",errorMessage);
    console.log("Use:\n\tyarn move <source_SQS_URL> <destination_SQS_url>");
    console.log("Expected SQS URL format: 'https://sqs.<region>.amazonaws.com/<account_id>/<queue_name>'");
    process.exit(-1)
}

const fromSqsUrl = process.argv[2];
const toSqsUrl = process.argv[3];

(async (): Promise<void> => {
    try {
        const sqsClient = new SQS();
        const sqsMove = new SqsMoveWithAttrs(sqsClient, fromSqsUrl, toSqsUrl);
        const startTime = new Date().getTime();
        const movedMessagesCount = await sqsMove.move();
        const endTime = new Date().getTime();
        console.log("%d messages have been moved within %d sec.", movedMessagesCount, Math.round((endTime-startTime)/1000))
    } catch (e) {
        if (e.message === "Missing region in config") {
            console.error(e.message);
            console.log("Define AWS_REGION environment variable to specify region used by AWS SDK.")
        } else {
            console.error(e);
        }
        process.exitCode = -1;
    }
})();
