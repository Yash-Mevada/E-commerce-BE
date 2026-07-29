

import crypto from "crypto"
import { AdminCreateUserCommand, AdminDeleteUserCommand, AdminSetUserPasswordCommand, CognitoIdentityProviderClient, InitiateAuthCommand } from "@aws-sdk/client-cognito-identity-provider";



const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION as string
})





export class CognitoServices {


  static async createUser(data: any) {


    const command = new AdminCreateUserCommand({
      UserPoolId: process.env.COGNITO_USER_POOL_ID,
      Username: data.email,
      TemporaryPassword: data.password,
      MessageAction: "SUPPRESS",
      UserAttributes: [
        {
          Name: "email",
          Value: data.email
        },
        {
          Name: "email_verified",
          Value: "true"
        },
        {
          Name: "phone_number",
          Value: data.phone_number
        },
        {
          Name: "given_name",
          Value: data.first_name
        },
        {
          Name: "family_name",
          Value: data.last_name

        }
      ]

    })



    const response = await cognitoClient.send(command)



    // Make password permanent

    await cognitoClient.send(
      new AdminSetUserPasswordCommand({
        UserPoolId: process.env.COGNITO_USER_POOL_ID,
        Username: data.email,
        Password: data.password,
        Permanent: true
      })
    )


    const sub = response.User?.Attributes?.find((attr: any) => attr.Name === "sub")?.Value

    if (!sub) {
      throw new Error("Cognito user created successfully, but 'sub' was not returned from AWS Cognito.")
    }

    return {
      cognitoSub: sub,
      username: response?.User?.Username,
    }

  }

  static async deleteUser(email: string) {
    const command = new AdminDeleteUserCommand({
      UserPoolId: process.env.COGNITO_USER_POOL_ID,
      Username: email,
    })
    await cognitoClient.send(command)
  }

  static async loginUser(data: any) {
    const clientId = process.env.COGNITO_CLIENT_ID!
    const clientSecret = process.env.COGNITO_CLIENT_SECRET
    
    const authParameters: Record<string, string> = {
      USERNAME: data.email,
      PASSWORD: data.password,
    }
    
    if (clientSecret) {
      const secretHash = crypto
        .createHmac("sha256", clientSecret)
        .update(data.email + clientId)
        .digest("base64")
      authParameters.SECRET_HASH = secretHash
    }

    const command = new InitiateAuthCommand({
      AuthFlow: "USER_PASSWORD_AUTH",
      ClientId: clientId,
      AuthParameters: authParameters,
    })
    const response = await cognitoClient.send(command)
    return response.AuthenticationResult
  }


}

