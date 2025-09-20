-- IMPROVE EMAIL TEMPLATES
-- Kjør dette i Supabase SQL Editor

-- Oppdater confirm signup template
UPDATE auth.email_templates 
SET 
  subject = 'Velkommen til Julegaveapp! 🎄',
  body_html = '
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; background-color: #f8f8ff; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #c41e3a, #2d5016); color: white; padding: 30px; text-align: center; }
        .content { padding: 30px; }
        .button { display: inline-block; background: #c41e3a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
        .footer { background: #f5f5f5; padding: 20px; text-align: center; color: #666; font-size: 14px; }
        .emoji { font-size: 24px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="emoji">🎄</div>
          <h1>Velkommen til Julegaveapp!</h1>
          <p>Din konto er nesten klar</p>
        </div>
        <div class="content">
          <h2>Bekreft din e-postadresse</h2>
          <p>Hei! Takk for at du registrerte deg på Julegaveapp. For å fullføre opprettelsen av kontoen din, må du bekrefte e-postadressen din.</p>
          <p>Klikk på knappen under for å bekrefte:</p>
          <a href="{{ .ConfirmationURL }}" class="button">Bekreft e-postadresse</a>
          <p>Hvis knappen ikke fungerer, kan du kopiere og lime inn denne lenken i nettleseren:</p>
          <p style="word-break: break-all; background: #f5f5f5; padding: 10px; border-radius: 4px;">{{ .ConfirmationURL }}</p>
          <p>Velkommen til julemagien! 🎁</p>
        </div>
        <div class="footer">
          <p>Dette er en automatisk e-post fra Julegaveapp</p>
        </div>
      </div>
    </body>
    </html>
  '
WHERE template_type = 'confirm_signup';

-- Oppdater invite user template
UPDATE auth.email_templates 
SET 
  subject = 'Du er invitert til Julegaveapp! 🎁',
  body_html = '
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; background-color: #f8f8ff; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #c41e3a, #2d5016); color: white; padding: 30px; text-align: center; }
        .content { padding: 30px; }
        .button { display: inline-block; background: #c41e3a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
        .footer { background: #f5f5f5; padding: 20px; text-align: center; color: #666; font-size: 14px; }
        .emoji { font-size: 24px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="emoji">🎁</div>
          <h1>Du er invitert!</h1>
          <p>Bli med i julemagien</p>
        </div>
        <div class="content">
          <h2>Velkommen til Julegaveapp!</h2>
          <p>Du har blitt invitert til å bli med i en julegavegruppe på Julegaveapp. Her kan du dele ønskelister med familie og venner, og få varsler når gavene går på tilbud!</p>
          <p>Klikk på knappen under for å opprette kontoen din og bli med:</p>
          <a href="{{ .ConfirmationURL }}" class="button">Bli med i gruppen</a>
          <p>Hvis knappen ikke fungerer, kan du kopiere og lime inn denne lenken i nettleseren:</p>
          <p style="word-break: break-all; background: #f5f5f5; padding: 10px; border-radius: 4px;">{{ .ConfirmationURL }}</p>
          <p>Vi gleder oss til å se deg i appen! 🎄</p>
        </div>
        <div class="footer">
          <p>Dette er en automatisk e-post fra Julegaveapp</p>
        </div>
      </div>
    </body>
    </html>
  '
WHERE template_type = 'invite_user';

-- Oppdater reset password template
UPDATE auth.email_templates 
SET 
  subject = 'Tilbakestill passord - Julegaveapp 🔐',
  body_html = '
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; background-color: #f8f8ff; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #c41e3a, #2d5016); color: white; padding: 30px; text-align: center; }
        .content { padding: 30px; }
        .button { display: inline-block; background: #c41e3a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
        .footer { background: #f5f5f5; padding: 20px; text-align: center; color: #666; font-size: 14px; }
        .emoji { font-size: 24px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="emoji">🔐</div>
          <h1>Tilbakestill passord</h1>
          <p>Få tilgang til kontoen din igjen</p>
        </div>
        <div class="content">
          <h2>Hei!</h2>
          <p>Vi mottok en forespørsel om å tilbakestille passordet for kontoen din på Julegaveapp.</p>
          <p>Hvis du ba om dette, klikk på knappen under for å velge et nytt passord:</p>
          <a href="{{ .ConfirmationURL }}" class="button">Tilbakestill passord</a>
          <p>Hvis knappen ikke fungerer, kan du kopiere og lime inn denne lenken i nettleseren:</p>
          <p style="word-break: break-all; background: #f5f5f5; padding: 10px; border-radius: 4px;">{{ .ConfirmationURL }}</p>
          <p><strong>Viktig:</strong> Denne lenken er kun gyldig i 1 time. Hvis du ikke ba om å tilbakestille passordet, kan du trygt ignorere denne e-posten.</p>
        </div>
        <div class="footer">
          <p>Dette er en automatisk e-post fra Julegaveapp</p>
        </div>
      </div>
    </body>
    </html>
  '
WHERE template_type = 'recovery';
