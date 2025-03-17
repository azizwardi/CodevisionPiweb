const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth2').Strategy;

const GOOGLE_CLIENT_ID = "243343116297-nacb4vh5h2v56vl2756dm7cgrjvr7vun.apps.googleusercontent.com";
const GOOGLE_CLIENT_SECRET = "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";

passport.use(new GoogleStrategy({
    clientID: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:8000/auth/google/callback", // ✅ Chemin corrigé
    passReqToCallback: true
  },
  function (request, accessToken, refreshToken, profile, done) {
      return done(null, profile); // ✅ Pas d'erreur ici
  }
));

passport.serializeUser(function(user, done) {
    done(null, user);
});

passport.deserializeUser(function(user, done) {
    done(null, user);
});

