#!/usr/bin/env node
'use strict';

process.env.AWS_SDK_LOAD_CONFIG = "true";
import {SQS} from "aws-sdk";

import {SqsMoveWithAttrs} from "./sqs-move-with-attrs";
import {getAwsAccountId, getCurrentAwsRegion, isSqsNameFormatValid, isSqsUrlFormatValid} from "./utils";

console.log("Move all messages with its attributes from one AWS SQS queue to another.");

interface ResolveSqsUrlResult {
    sqsUrl: string | null;
    errorMessage?: string;
}

const resolveSqsUrl = async (sqsUrlOrName: string): Promise<ResolveSqsUrlResult> => {
    if (isSqsUrlFormatValid(sqsUrlOrName)) {
        return {sqsUrl: sqsUrlOrName}
    }
    if (!isSqsNameFormatValid(sqsUrlOrName)) {
        return {
            sqsUrl: null,
            errorMessage: "Invalid format for SQS URL of SQS name: '"+sqsUrlOrName+"'"
        }
    }
    const awsRegion = getCurrentAwsRegion();
    if (!awsRegion) {
        return {
            sqsUrl: null,
            errorMessage: "Can't determine AWS Region to build SQS URL from SQS name '"+sqsUrlOrName+"'"
        }
    }
    const awsAccountId = await getAwsAccountId();
    if (!awsAccountId) {
        return {
            sqsUrl: null,
            errorMessage: "Can't determine AWS Account ID to build SQS URL from SQS name '"+sqsUrlOrName+"'"
        }
    }
    return {sqsUrl: `https://sqs.${awsRegion}.amazonaws.com/${awsAccountId}/${sqsUrlOrName}`}
};

(async (): Promise<void> => {
    try {
        let fromSqsUrl: string | undefined;
        let toSqsUrl: string | undefined;
        let errorMessage: string | undefined;
        if (process.argv.length != 4) {
            errorMessage = "Unexpected number of arguments.";
        } else {
            let resolveSqsUrlResult = await resolveSqsUrl(process.argv[2]);
            if (!resolveSqsUrlResult.sqsUrl) {
                errorMessage = resolveSqsUrlResult.errorMessage;
            } else {
                fromSqsUrl = resolveSqsUrlResult.sqsUrl;
                resolveSqsUrlResult = await resolveSqsUrl(process.argv[3]);
                if (!resolveSqsUrlResult.sqsUrl) {
                    errorMessage = resolveSqsUrlResult.errorMessage
                } else {
                    toSqsUrl = resolveSqsUrlResult.sqsUrl
                }
            }
        }

        if (!getCurrentAwsRegion()) {
            console.error("Missing region in config.");
            console.log("Define AWS_REGION environment variable or specify region in AWS config file.");
            process.exitCode = -1;
            return
        }

        if (errorMessage || !fromSqsUrl || !toSqsUrl) {
            console.log("ERROR: %s",errorMessage);
            console.log("Use:\n\tyarn move <source_SQS_URL_or_name> <destination_SQS_url_or_name>");
            console.log("Expected SQS URL format: 'https://sqs.<region>.amazonaws.com/<account_id>/<queue_name>'");
            process.exitCode = -1;
            return
        }

        console.log("     source: %s", fromSqsUrl);
        console.log("destination: %s", toSqsUrl);

        const sqsClient = new SQS();
        const sqsMove = new SqsMoveWithAttrs(sqsClient, fromSqsUrl, toSqsUrl);
        const startTime = new Date().getTime();
        const movedMessagesCount = await sqsMove.move();
        const endTime = new Date().getTime();
        console.log("\r%d messages have been moved within %d sec.", movedMessagesCount, Math.round((endTime-startTime)/1000))

    } catch (e) {
        console.error(e);
        process.exitCode = -1;
    }
})();
