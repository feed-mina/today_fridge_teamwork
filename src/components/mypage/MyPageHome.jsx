"use client";

import { useState } from "react";
import Link from "next/link";
import LoginButton from "@/components/layout/public/LoginButton";
import Modal from "@/components/ui/Modal";
import { useAuth } from "@/context/AuthContext";
import { useMyPageData } from "@/features/mypage/useMyPageData";
import AccountSettings from "./AccountSettings";
import ActivitySummary from "./ActivitySummary";
import HealthPreferenceCard from "./HealthPreferenceCard";
import PasswordChangeCard from "./PasswordChangeCard";
import ProfileCard from "./ProfileCard";
import QuickLinks from "./QuickLinks";
import RecentActivity from "./RecentActivity";

function getSessionProfile(user) {
  if (!user) {
    return null;
  }

  return {
    userId: user.userId ?? null,
    loginId: user.loginId ?? "",
    nickname: user.nickname || user.loginId || "회원",
    email: "",
    profileImageUrl: "",
    status: "세션 확인됨",
    emailVerified: null,
  };
}

export default function MyPageHome() {
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const { user } = useAuth();
  const { myPage, loading, refresh } = useMyPageData();
  const sessionProfile = getSessionProfile(user);
  const useSessionFallback = !loading && myPage.authRequired && Boolean(sessionProfile);
  const passwordChangeDisabled = loading;
  const passwordChangeDisabledReason = "";
  const displayMyPage = useSessionFallback
    ? {
        ...myPage,
        profile: sessionProfile,
        authRequired: false,
        activityUnavailable: true,
        errors: ["상세 회원 정보를 확인하지 못해 기본 정보만 표시합니다."],
      }
    : myPage;

  if (!loading && displayMyPage.authRequired) {
    return (
      <div className="layout-container">
        <section className="section-block">
          <div className="section-head">
            <div>
              <h1 className="section-title">마이페이지</h1>
              <p className="section-desc">
                로그인 상태를 확인한 뒤 회원 정보를 보여줍니다.
              </p>
            </div>
          </div>

          <article className="card-box">
            <div className="card-body">
              <span className="badge badge-warning">로그인 필요</span>
              <h2 className="mt-4 text-2xl font-extrabold text-[var(--color-text)]">
                로그인 확인이 필요합니다.
              </h2>
              <p className="card-desc mt-2">
                로그인하면 닉네임, 프로필, 냉장고 활동, 작성 후기를 확인할 수 있습니다.
              </p>
              <div className="card-actions">
                <LoginButton />
              </div>
            </div>
          </article>
        </section>
      </div>
    );
  }

  return (
    <div className="layout-container">
      <section className="section-block">
        <div className="section-head">
          <div>
            <h1 className="section-title">마이페이지</h1>
            <p className="section-desc">
              회원 정보와 개인 활동을 확인하고 자주 쓰는 화면으로 이동합니다.
            </p>
          </div>
          <div className="section-actions">
            <Link className="btn btn-outline" href="/dashboard">
              대시보드
            </Link>
          </div>
        </div>

        <ProfileCard profile={displayMyPage.profile} loading={loading} onRefresh={refresh} />
        <HealthPreferenceCard profile={displayMyPage.profile} loading={loading} onRefresh={refresh} />
      </section>

      <ActivitySummary activity={displayMyPage.activity} loading={loading} />
      <RecentActivity
        recentPosts={displayMyPage.recentPosts}
        bookmarkedRecipes={displayMyPage.bookmarkedRecipes}
        loading={loading}
      />

      <section className="section-block">
        <div className="grid-2">
          <AccountSettings onPasswordChange={() => setPasswordModalOpen(true)} />
          <QuickLinks />
        </div>
      </section>

      <Modal
        description="현재 비밀번호를 확인한 뒤 새 비밀번호로 변경합니다."
        isOpen={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
        showFooter={false}
        title="비밀번호 변경"
      >
        <PasswordChangeCard
          disabled={passwordChangeDisabled}
          disabledReason={passwordChangeDisabledReason}
          embedded
        />
      </Modal>
    </div>
  );
}
