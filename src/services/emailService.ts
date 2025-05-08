
interface EmailSendParams {
  to: string;
  subject: string;
  html: string;
}

/**
 * Sends an email with login credentials
 */
export const sendLoginCredentialsEmail = async (
  email: string, 
  password: string, 
  name?: string, 
  loginUrl: string = `${window.location.origin}/login`
) => {
  try {
    const subject = 'Seus dados de acesso';
    const greeting = name ? `Olá, ${name}!` : 'Olá!';
    
    const html = `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <h1 style="color: #2c3e50;">${greeting}</h1>
        <p>Seu acesso foi criado com sucesso!</p>
        <p>Aqui estão seus dados de login:</p>
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Login:</strong> ${email}</p>
          <p><strong>Senha:</strong> ${password}</p>
        </div>
        <p>Para acessar o seu curso, clique no botão abaixo:</p>
        <div style="margin: 20px 0;">
          <a href="${loginUrl}" style="background-color: #3498db; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Acessar meu curso</a>
        </div>
        <p>Se o botão acima não funcionar, você também pode acessar usando este link: <a href="${loginUrl}">${loginUrl}</a></p>
        <p>Agradecemos sua compra!</p>
      </div>
    `;
    
    // Send the email
    return await sendEmail({
      to: email,
      subject,
      html
    });
  } catch (error) {
    console.error('Error sending login credentials email:', error);
    throw error;
  }
};

/**
 * Send email using server-side function
 */
export const sendEmail = async (params: EmailSendParams) => {
  try {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(params)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to send email: ${errorText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error in sendEmail:', error);
    throw error;
  }
};
