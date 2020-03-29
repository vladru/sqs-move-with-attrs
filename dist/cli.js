#!/usr/bin/env node
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
process.env.AWS_SDK_LOAD_CONFIG = "true";
const aws_sdk_1 = require("aws-sdk");
const sqs_move_with_attrs_1 = require("./sqs-move-with-attrs");
const utils_1 = require("./utils");
console.log("Move all messages with its attributes from one AWS SQS queue to another.");
const resolveSqsUrl = async (sqsUrlOrName) => {
    if (utils_1.isSqsUrlFormatValid(sqsUrlOrName)) {
        return { sqsUrl: sqsUrlOrName };
    }
    if (!utils_1.isSqsNameFormatValid(sqsUrlOrName)) {
        return {
            sqsUrl: null,
            errorMessage: "Invalid format for SQS URL of SQS name: '" + sqsUrlOrName + "'"
        };
    }
    const awsRegion = utils_1.getCurrentAwsRegion();
    if (!awsRegion) {
        return {
            sqsUrl: null,
            errorMessage: "Can't determine AWS Region to build SQS URL from SQS name '" + sqsUrlOrName + "'"
        };
    }
    const awsAccountId = await utils_1.getAwsAccountId();
    if (!awsAccountId) {
        return {
            sqsUrl: null,
            errorMessage: "Can't determine AWS Account ID to build SQS URL from SQS name '" + sqsUrlOrName + "'"
        };
    }
    return { sqsUrl: `https://sqs.${awsRegion}.amazonaws.com/${awsAccountId}/${sqsUrlOrName}` };
};
(async () => {
    try {
        let fromSqsUrl;
        let toSqsUrl;
        let errorMessage;
        if (process.argv.length != 4) {
            errorMessage = "Unexpected number of arguments.";
        }
        else {
            let resolveSqsUrlResult = await resolveSqsUrl(process.argv[2]);
            if (!resolveSqsUrlResult.sqsUrl) {
                errorMessage = resolveSqsUrlResult.errorMessage;
            }
            else {
                fromSqsUrl = resolveSqsUrlResult.sqsUrl;
                resolveSqsUrlResult = await resolveSqsUrl(process.argv[3]);
                if (!resolveSqsUrlResult.sqsUrl) {
                    errorMessage = resolveSqsUrlResult.errorMessage;
                }
                else {
                    toSqsUrl = resolveSqsUrlResult.sqsUrl;
                }
            }
        }
        if (!utils_1.getCurrentAwsRegion()) {
            console.error("Missing region in config.");
            console.log("Define AWS_REGION environment variable or specify region in AWS config file.");
            process.exitCode = -1;
            return;
        }
        if (errorMessage || !fromSqsUrl || !toSqsUrl) {
            console.log("ERROR: %s", errorMessage);
            console.log("Use:\n\tyarn move <source_SQS_URL_or_name> <destination_SQS_url_or_name>");
            console.log("Expected SQS URL format: 'https://sqs.<region>.amazonaws.com/<account_id>/<queue_name>'");
            process.exitCode = -1;
            return;
        }
        console.log("     source: %s", fromSqsUrl);
        console.log("destination: %s", toSqsUrl);
        const sqsClient = new aws_sdk_1.SQS();
        const sqsMove = new sqs_move_with_attrs_1.SqsMoveWithAttrs(sqsClient, fromSqsUrl, toSqsUrl);
        let receivedMessagesCount = 0;
        let movedMessagesCount = 0;
        sqsMove.on("progress", (receivedMessages, movedMessages) => {
            receivedMessagesCount += receivedMessages;
            movedMessagesCount += movedMessages;
            process.stdout.write("\rMessages received " + receivedMessagesCount + ", moved " + movedMessagesCount);
        });
        const startTime = new Date().getTime();
        const movedMessagesTotal = await sqsMove.move();
        const endTime = new Date().getTime();
        console.log("\r%d messages have been moved within %d sec.", movedMessagesTotal, Math.round((endTime - startTime) / 1000));
    }
    catch (e) {
        console.error(e);
        process.exitCode = -1;
    }
})();
//# sourceMappingURL=cli.js.map