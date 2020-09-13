let secureEnv = require('secure-env');
global.env    = secureEnv({'secret': 'mySecure-env1!'});
module.exports = {
   port        : global.env.PORT || 8080,
   myPort      : global.env.PORT,
   mlab_connect: global.env.API_URL,
   mail_domain: global.env.MAIL_DOMAIN,
   mailgun_key: global.env.MAILGUN_KEY,
   node_env: global.env.NODE_ENV,
   recap_site_key: global.env.SITE_KEY,
   recap_secret_key: global.env.SECRET_KEY
};
