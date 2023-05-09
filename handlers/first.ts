import { Handler, Context } from 'aws-lambda';
import { StateMachineContext } from "./util";

interface Event {
    data: {
        name: string
    }
    context: StateMachineContext
}

export const handler: Handler = async (
    event: Event,
    context: Context,
) => {
    console.log(event);

    return {
        name: event.data.name,
        message: `hello, ${event.data.name}`,
    };
    // return `hello, ${event.name}`
};