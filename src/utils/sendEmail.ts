
import { Resend } from "resend"


const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendForgotPasswordEmail(email: string, resetLink: string) {
  try {

    const { data } = await resend.emails.send({
      from: "sandbox@resend.dev",
      to: email,
      subject: "Reset Your Password",
      html: `
        <p>You requested a password reset.</p>
        <p>Click <a href="${resetLink}">here</a> to reset your password.</p>
        <p>This link expires in 10 minutes.</p>
      `,
    })

  } catch (error) {
    const message = error instanceof Error ? error.message : "Error while sending forgot password email"
    throw new Error(message)
  }
}