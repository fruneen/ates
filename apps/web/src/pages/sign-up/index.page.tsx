import { z } from 'zod';
import { useState, useEffect } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { Button, Stack, TextInput, PasswordInput, Group, Title, Text, Checkbox, SimpleGrid, Tooltip, Anchor } from '@mantine/core';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { accountApi } from 'resources/account';

import { handleError } from 'utils';
import { RoutePath } from 'routes';
import config from 'config';

import { EMAIL_REGEX, PASSWORD_REGEX } from 'app-constants';

import { GoogleIcon } from 'public/icons';

const schema = z.object({
  firstName: z.string().min(1, 'Please enter First name').max(100),
  lastName: z.string().min(1, 'Please enter Last name').max(100),
  email: z.string().regex(EMAIL_REGEX, 'Email format is incorrect.'),
  password: z.string().regex(PASSWORD_REGEX, 'The password must contain 6 or more characters with at least one letter (a-z) and one number (0-9).'),
});

type SignUpParams = z.infer<typeof schema>;

const passwordRules = [
  {
    title: 'Be 6-50 characters',
    done: false,
  },
  {
    title: 'Have at least one letter',
    done: false,
  },
  {
    title: 'Have at least one number',
    done: false,
  },
];

const SignUp: NextPage = () => {
  const [email, setEmail] = useState<string | null>(null);
  const [signupToken, setSignupToken] = useState<string | null>(null);
  const [registered, setRegistered] = useState(false);

  const [passwordRulesData, setPasswordRulesData] = useState(passwordRules);
  const [opened, setOpened] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    watch,
    formState: { errors },
  } = useForm<SignUpParams>({ resolver: zodResolver(schema) });

  const passwordValue = watch('password', '');

  useEffect(() => {
    const updatedPasswordRulesData = [...passwordRules];

    updatedPasswordRulesData[0].done = passwordValue.length >= 6 && passwordValue.length <= 50;
    updatedPasswordRulesData[1].done = /[a-zA-Z]/.test(passwordValue);
    updatedPasswordRulesData[2].done = /\d/.test(passwordValue);

    setPasswordRulesData(updatedPasswordRulesData);
  }, [passwordValue]);

  const { mutate: signUp, isPending: isSignUpPending } = accountApi.useSignUp<SignUpParams>();

  const onSubmit = (data: SignUpParams) => signUp(data, {
    onSuccess: (response: any) => {
      if (response.signupToken) setSignupToken(response.signupToken);

      setRegistered(true);
      setEmail(data.email);
    },
    onError: (e) => handleError(e, setError),
  });

  const label = (
    <SimpleGrid cols={1} spacing="xs" p={4}>
      <Text>Password must:</Text>

      {passwordRulesData.map((ruleData) => (
        <Checkbox
          key={ruleData.title}
          label={ruleData.title}
          checked={ruleData.done}
          color="white"
          iconColor="dark"
        />
      ))}
    </SimpleGrid>
  );

  if (registered) {
    return (
      <>
        <Head>
          <title>Sign up</title>
        </Head>

        <Stack w={450}>
          <Title order={2}>Thanks!</Title>

          <Text size="md" c="gray.6">
            Please follow the instructions from the email to complete a sign up process.
            We sent an email with a confirmation link to
            {' '}
            <b>{email}</b>
          </Text>

          {signupToken && (
            <Stack gap={0}>
              <Text>You look like a cool developer.</Text>
              <Anchor
                size="sm"
                href={`${config.API_URL}/account/verify-email?token=${signupToken}`}
                target="_blank"
              >
                Verify email
              </Anchor>
            </Stack>
          )}
        </Stack>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Sign up</title>
      </Head>

      <Stack w={400} gap={20}>
        <Stack gap={32}>
          <Title order={1}>Sign Up</Title>

          <form onSubmit={handleSubmit(onSubmit)}>
            <Stack gap={20}>
              <TextInput
                {...register('firstName')}
                label="First Name"
                maxLength={100}
                placeholder="Enter first Name"
                error={errors.firstName?.message}
              />

              <TextInput
                {...register('lastName')}
                label="Last Name"
                maxLength={100}
                placeholder="Enter last Name"
                error={errors.lastName?.message}
              />

              <TextInput
                {...register('email')}
                label="Email Address"
                placeholder="Enter email Address"
                error={errors.email?.message}
              />

              <Tooltip
                label={label}
                opened={opened}
                withArrow
              >
                <PasswordInput
                  {...register('password')}
                  label="Password"
                  placeholder="Enter password"
                  onFocus={() => setOpened(true)}
                  onBlur={() => setOpened(false)}
                  error={errors.password?.message}
                />
              </Tooltip>
            </Stack>

            <Button
              type="submit"
              loading={isSignUpPending}
              fullWidth
              mt={32}
            >
              Sign Up
            </Button>
          </form>
        </Stack>

        <Stack gap={32}>
          <Button
            component="a"
            leftSection={<GoogleIcon />}
            href={`${config.API_URL}/account/sign-in/google/auth`}
            variant="outline"
          >
            Continue with Google
          </Button>

          <Group justify="center" gap={12}>
            Have an account?
            <Anchor component={Link} href={RoutePath.SignIn}>
              Sign In
            </Anchor>
          </Group>
        </Stack>
      </Stack>
    </>
  );
};

export default SignUp;
