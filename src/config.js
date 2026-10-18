import { Amplify } from 'aws-amplify';

export const awsConfig = {
    Auth: {
        Cognito: {
            userPoolId: 'us-east-1_gKQfGOhZ9',
            userPoolClientId: 'g2f5pg3grd15pq6dd8mv3vjp4',
            signUpVerificationMethod: 'code',
            loginWith: {
                email: true,
            },
        },
    },
    API: {
        GraphQL: {
            endpoint: 'https://3fq3jgoh6jfevhtk6rj4glclsq.appsync-api.us-east-1.amazonaws.com/graphql',
            region: 'us-east-1',
            defaultAuthMode: 'userPool',
        },
    },
};

Amplify.configure(awsConfig);
