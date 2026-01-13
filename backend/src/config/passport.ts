import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { querySecure } from './database';
import { v4 as uuidv4 } from 'uuid';

interface OAuthProfile {
  id: string;
  displayName: string;
  emails?: Array<{ value: string; verified: boolean }>;
  photos?: Array<{ value: string }>;
  provider: string;
  _json: any;
}

// Serialize user
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

// Deserialize user
passport.deserializeUser(async (id: string, done) => {
  try {
    const result = await querySecure('SELECT * FROM users WHERE id = $1', [id]);
    done(null, result.rows[0]);
  } catch (error) {
    done(error, null);
  }
});

// Google OAuth Strategy
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: `${process.env.API_URL || 'http://localhost:5000'}/api/auth/google/callback`,
      },
      async (accessToken, refreshToken, profile: OAuthProfile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) {
            return done(new Error('No email found from Google'), undefined);
          }

          // Check if user exists with this email
          let userResult = await querySecure('SELECT * FROM users WHERE email = $1', [email]);
          let user = userResult.rows[0];

          if (user) {
            // Update OAuth provider info
            await querySecure(
              `INSERT INTO oauth_providers (user_id, provider, provider_id, provider_email, access_token, refresh_token, profile_data, updated_at)
               VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
               ON CONFLICT (provider, provider_id) DO UPDATE SET
                 access_token = $5,
                 refresh_token = $6,
                 profile_data = $7,
                 updated_at = CURRENT_TIMESTAMP`,
              [user.id, 'google', profile.id, email, accessToken, refreshToken || null, JSON.stringify(profile._json)]
            );

            // Update user's last login
            await querySecure('UPDATE users SET last_login = CURRENT_TIMESTAMP, email_verified = TRUE WHERE id = $1', [user.id]);
          } else {
            // Create new user
            const userId = uuidv4();
            const username = profile.emails[0].value.split('@')[0] + '_' + Math.random().toString(36).substr(2, 4);

            await querySecure(
              `INSERT INTO users (id, email, username, full_name, email_verified, password_hash, oauth_provider, oauth_id, profile_picture, created_at, last_login)
               VALUES ($1, $2, $3, $4, TRUE, $5, 'google', $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
              [userId, email, username, profile.displayName || username, 'OAUTH_USER', profile.id, profile.photos?.[0]?.value || null]
            );

            // Create OAuth provider record
            await querySecure(
              `INSERT INTO oauth_providers (user_id, provider, provider_id, provider_email, access_token, refresh_token, profile_data)
               VALUES ($1, 'google', $2, $3, $4, $5, $6)`,
              [userId, profile.id, email, accessToken, refreshToken || null, JSON.stringify(profile._json)]
            );

            // Create user profile
            await querySecure(
              `INSERT INTO user_profiles (user_id, profile_picture)
               VALUES ($1, $2)`,
              [userId, profile.photos?.[0]?.value || null]
            );

            userResult = await querySecure('SELECT * FROM users WHERE id = $1', [userId]);
            user = userResult.rows[0];
          }

          return done(null, user);
        } catch (error) {
          console.error('Google OAuth error:', error);
          return done(error as Error, undefined);
        }
      }
    )
  );
}

// GitHub OAuth Strategy
if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  passport.use(
    new GitHubStrategy(
      {
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: `${process.env.API_URL || 'http://localhost:5000'}/api/auth/github/callback`,
        scope: ['user:email'],
      },
      async (accessToken: string, refreshToken: string, profile: OAuthProfile, done: any) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) {
            return done(new Error('No email found from GitHub'), undefined);
          }

          // Check if user exists with this email
          let userResult = await querySecure('SELECT * FROM users WHERE email = $1', [email]);
          let user = userResult.rows[0];

          if (user) {
            // Update OAuth provider info
            await querySecure(
              `INSERT INTO oauth_providers (user_id, provider, provider_id, provider_email, access_token, refresh_token, profile_data, updated_at)
               VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
               ON CONFLICT (provider, provider_id) DO UPDATE SET
                 access_token = $5,
                 refresh_token = $6,
                 profile_data = $7,
                 updated_at = CURRENT_TIMESTAMP`,
              [user.id, 'github', profile.id, email, accessToken, refreshToken || null, JSON.stringify(profile._json)]
            );

            // Update user's last login
            await querySecure('UPDATE users SET last_login = CURRENT_TIMESTAMP, email_verified = TRUE WHERE id = $1', [user.id]);
          } else {
            // Create new user
            const userId = uuidv4();
            const username = profile.username || profile.emails[0].value.split('@')[0] + '_' + Math.random().toString(36).substr(2, 4);

            await querySecure(
              `INSERT INTO users (id, email, username, full_name, email_verified, password_hash, oauth_provider, oauth_id, profile_picture, created_at, last_login)
               VALUES ($1, $2, $3, $4, TRUE, $5, 'github', $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
              [userId, email, username, profile.displayName || username, 'OAUTH_USER', profile.id, profile.photos?.[0]?.value || null]
            );

            // Create OAuth provider record
            await querySecure(
              `INSERT INTO oauth_providers (user_id, provider, provider_id, provider_email, access_token, refresh_token, profile_data)
               VALUES ($1, 'github', $2, $3, $4, $5, $6)`,
              [userId, profile.id, email, accessToken, refreshToken || null, JSON.stringify(profile._json)]
            );

            // Create user profile
            await querySecure(
              `INSERT INTO user_profiles (user_id, profile_picture, github_url)
               VALUES ($1, $2, $3)`,
              [userId, profile.photos?.[0]?.value || null, profile._json.html_url || null]
            );

            userResult = await querySecure('SELECT * FROM users WHERE id = $1', [userId]);
            user = userResult.rows[0];
          }

          return done(null, user);
        } catch (error) {
          console.error('GitHub OAuth error:', error);
          return done(error as Error, undefined);
        }
      }
    )
  );
}

export default passport;
