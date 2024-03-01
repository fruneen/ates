import { z } from 'zod';

import { AppKoaContext, Next, AppRouter } from 'types';
import { EMAIL_REGEX, PASSWORD_REGEX } from 'app-constants';

import { userService } from 'resources/user';
import { tokenService } from 'resources/token';

import { validateMiddleware } from 'middlewares';
import { securityUtil } from 'utils';

const schema = z.object({
  firstName: z.string().min(1, 'Please enter First name').max(100),
  lastName: z.string().min(1, 'Please enter Last name').max(100),
  email: z.string().regex(EMAIL_REGEX, 'Email format is incorrect.'),
  password: z.string().regex(PASSWORD_REGEX, 'The password must contain 6 or more characters with at least one letter (a-z) and one number (0-9).'),
});

type ValidatedData = z.infer<typeof schema>;

async function validator(ctx: AppKoaContext<ValidatedData>, next: Next) {
  const { email } = ctx.validatedData;

  const isUserExists = await userService.exists({ email });

  ctx.assertClientError(!isUserExists, {
    email: 'User with this email is already registered',
  });

  await next();
}

async function handler(ctx: AppKoaContext<ValidatedData>) {
  const {
    firstName,
    lastName,
    email,
    password,
  } = ctx.validatedData;

  const hash = await securityUtil.getHash(password);

  const user = await userService.insertOne({
    email,
    firstName,
    lastName,
    passwordHash: hash.toString(),
  });

  const { value: token } = await tokenService.createToken(user._id);

  ctx.body = { token };
}

export default (router: AppRouter) => {
  router.post('/sign-up', validateMiddleware(schema), validator, handler);
};
