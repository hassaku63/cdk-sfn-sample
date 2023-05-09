import { Handler, Context } from 'aws-lambda';
import { StateMachineContext } from "./util";

interface Event {
    data: {
        name: string
        message: string
    }
    context: StateMachineContext
}

export const handler: Handler = async (
    event: Event,
    context: Context,
) => {
    console.log(event);

    const prob = Math.random()
    let success: boolean;
    if (prob > 0.5) {
        success = true;
    } else {
        success = false;
    }

    return {
        name: event.data.name,
        message: `hello, ${event.data.name}`,
        success,
    };

    // return success;
};