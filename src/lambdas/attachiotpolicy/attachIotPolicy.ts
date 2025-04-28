import { IoTClient, AttachPolicyCommand } from "@aws-sdk/client-iot";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

const iotClient = new IoTClient({});
const IOT_POLICY_NAME = process.env.IOT_POLICY_NAME || 'DefaultIoTPolicy';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    if (!event.body) {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: 'Missing request body' })
        };
    }

    try {
        const { identityId } = JSON.parse(event.body);

        if (!identityId) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'identityId is required' })
            };
        }

        await iotClient.send(new AttachPolicyCommand({
            policyName: IOT_POLICY_NAME,
            target: identityId
        }));

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Policy attached successfully' })
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: 'Error attaching policy',
                error: error instanceof Error ? error.message : 'Unknown error'
            })
        };
    }
};
