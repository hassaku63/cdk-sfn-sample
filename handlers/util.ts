export interface StateMachineContext {
    Execution: {
        Id: string
        Input: any
        Name: string
        RoleArn: string
        StartTime: string
    },
    State: {
        EnteredTime: string
        Name: string
        RetryCount: number
    },
    StateMachine: {
        Id: string
        Name: string
    },
    Task: {
        Token: string
    }
}