'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const aws_sdk_1 = __importDefault(require("aws-sdk"));
/**
 * @param sqsUrl
 * @returns true if format of string passed as argument match to SQS URL pattern
 */
exports.isSqsUrlFormatValid = (sqsUrl) => {
    const sqsUrlRegex = /^https:\/\/sqs\.[\w-]+\.amazonaws\.com\/[\d]+\/.+$/;
    return sqsUrlRegex.test(sqsUrl);
};
exports.isSqsNameFormatValid = (sqsName) => {
    // look at https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-quotas.html
    const sqsNameReg = /^[\w-]{1,80}$/;
    return sqsNameReg.test(sqsName);
};
exports.getCurrentAwsRegion = () => {
    return aws_sdk_1.default.config.region;
};
exports.getAwsAccountId = async () => {
    const stsClient = new aws_sdk_1.default.STS();
    const resp = await stsClient.getCallerIdentity().promise();
    return resp.Account;
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvdXRpbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBWSxDQUFDOzs7OztBQUViLHNEQUEwQjtBQUUxQjs7O0dBR0c7QUFDVSxRQUFBLG1CQUFtQixHQUFHLENBQUMsTUFBYyxFQUFXLEVBQUU7SUFDM0QsTUFBTSxXQUFXLEdBQUcsb0RBQW9ELENBQUM7SUFDekUsT0FBTyxXQUFXLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFBO0FBQ25DLENBQUMsQ0FBQztBQUVXLFFBQUEsb0JBQW9CLEdBQUcsQ0FBQyxPQUFlLEVBQVcsRUFBRTtJQUM3RCxxR0FBcUc7SUFDckcsTUFBTSxVQUFVLEdBQUcsZUFBZSxDQUFDO0lBQ25DLE9BQU8sVUFBVSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQTtBQUVuQyxDQUFDLENBQUM7QUFFVyxRQUFBLG1CQUFtQixHQUFHLEdBQXVCLEVBQUU7SUFDeEQsT0FBTyxpQkFBRyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUE7QUFDNUIsQ0FBQyxDQUFDO0FBRVcsUUFBQSxlQUFlLEdBQUcsS0FBSyxJQUFpQyxFQUFFO0lBQ3JFLE1BQU0sU0FBUyxHQUFHLElBQUksaUJBQUcsQ0FBQyxHQUFHLEVBQUUsQ0FBQztJQUNoQyxNQUFNLElBQUksR0FBRyxNQUFNLFNBQVMsQ0FBQyxpQkFBaUIsRUFBRSxDQUFDLE9BQU8sRUFBRSxDQUFDO0lBQzNELE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQTtBQUNyQixDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XHJcblxyXG5pbXBvcnQgQVdTIGZyb20gXCJhd3Mtc2RrXCI7XHJcblxyXG4vKipcclxuICogQHBhcmFtIHNxc1VybFxyXG4gKiBAcmV0dXJucyB0cnVlIGlmIGZvcm1hdCBvZiBzdHJpbmcgcGFzc2VkIGFzIGFyZ3VtZW50IG1hdGNoIHRvIFNRUyBVUkwgcGF0dGVyblxyXG4gKi9cclxuZXhwb3J0IGNvbnN0IGlzU3FzVXJsRm9ybWF0VmFsaWQgPSAoc3FzVXJsOiBzdHJpbmcpOiBib29sZWFuID0+IHtcclxuICAgIGNvbnN0IHNxc1VybFJlZ2V4ID0gL15odHRwczpcXC9cXC9zcXNcXC5bXFx3LV0rXFwuYW1hem9uYXdzXFwuY29tXFwvW1xcZF0rXFwvLiskLztcclxuICAgIHJldHVybiBzcXNVcmxSZWdleC50ZXN0KHNxc1VybClcclxufTtcclxuXHJcbmV4cG9ydCBjb25zdCBpc1Nxc05hbWVGb3JtYXRWYWxpZCA9IChzcXNOYW1lOiBzdHJpbmcpOiBib29sZWFuID0+IHtcclxuICAgIC8vIGxvb2sgYXQgaHR0cHM6Ly9kb2NzLmF3cy5hbWF6b24uY29tL0FXU1NpbXBsZVF1ZXVlU2VydmljZS9sYXRlc3QvU1FTRGV2ZWxvcGVyR3VpZGUvc3FzLXF1b3Rhcy5odG1sXHJcbiAgICBjb25zdCBzcXNOYW1lUmVnID0gL15bXFx3LV17MSw4MH0kLztcclxuICAgIHJldHVybiBzcXNOYW1lUmVnLnRlc3Qoc3FzTmFtZSlcclxuXHJcbn07XHJcblxyXG5leHBvcnQgY29uc3QgZ2V0Q3VycmVudEF3c1JlZ2lvbiA9ICgpOiBzdHJpbmcgfCB1bmRlZmluZWQgPT4ge1xyXG4gICAgcmV0dXJuIEFXUy5jb25maWcucmVnaW9uXHJcbn07XHJcblxyXG5leHBvcnQgY29uc3QgZ2V0QXdzQWNjb3VudElkID0gYXN5bmMgKCk6IFByb21pc2U8c3RyaW5nIHwgdW5kZWZpbmVkPiA9PiB7XHJcbiAgY29uc3Qgc3RzQ2xpZW50ID0gbmV3IEFXUy5TVFMoKTtcclxuICBjb25zdCByZXNwID0gYXdhaXQgc3RzQ2xpZW50LmdldENhbGxlcklkZW50aXR5KCkucHJvbWlzZSgpO1xyXG4gIHJldHVybiByZXNwLkFjY291bnRcclxufTsiXX0=