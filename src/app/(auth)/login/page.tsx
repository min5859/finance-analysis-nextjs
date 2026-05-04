import Image from 'next/image';
import { signIn } from '@/auth';

const errorMessages: Record<string, string> = {
  domain: '회사 도메인 계정으로만 로그인할 수 있습니다.',
  OAuthAccountNotLinked: '이미 다른 방식으로 가입된 이메일입니다.',
  AccessDenied: '로그인이 거부되었습니다. 관리자에게 문의하세요.',
  Configuration: '서버 인증 설정에 문제가 있습니다. 관리자에게 문의하세요.',
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; callbackUrl?: string }>;
}) {
  const { error, callbackUrl } = await searchParams;
  const errorMsg = error ? (errorMessages[error] ?? '로그인에 실패했습니다.') : null;

  return (
    <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
      <div className="flex flex-col items-center mb-8">
        <div className="bg-gray-900 rounded p-3 mb-4">
          <Image
            src="/04.M&AIKorea_CI_hor_transparent-04(white).png"
            alt="M&AI Korea"
            width={224}
            height={48}
            priority
          />
        </div>
        <h1 className="text-xl font-semibold text-gray-800">기업 재무 분석 시스템</h1>
        <p className="text-sm text-gray-500 mt-1">로그인이 필요합니다</p>
      </div>

      {errorMsg && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {errorMsg}
        </div>
      )}

      <form
        action={async () => {
          'use server';
          await signIn('google', { redirectTo: callbackUrl ?? '/' });
        }}
      >
        <button
          type="submit"
          className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
        >
          <GoogleIcon />
          <span>Google 계정으로 로그인</span>
        </button>
      </form>

      <p className="mt-6 text-xs text-gray-400 text-center">
        등록된 회사 도메인 계정으로만 접근 가능합니다.
      </p>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
      />
      <path
        fill="#FF3D00"
        d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571.001-.001.002-.001.003-.002l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
      />
    </svg>
  );
}
