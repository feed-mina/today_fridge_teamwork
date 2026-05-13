"use client";
import { requestHealthPreferenceSave, updatePhysicalMetrics } from "@/api/myPageApi";

const initialForm = {
  heightCm: "",
  weightKg: "",
  gender: "",
  age: "",
  milkAllergy: false,
  eggAllergy: false,
  diet: false,
  lowSodium: false,
};

function getInitialForm(profile) {
  return {
    heightCm: profile?.heightCm ?? "",
    weightKg: profile?.weightKg ?? "",
    gender: profile?.gender ?? "",
    age: profile?.age ?? "",
    milkAllergy: Boolean(profile?.milkAllergy),
    eggAllergy: Boolean(profile?.eggAllergy),
    diet: Boolean(profile?.diet),
    lowSodium: Boolean(profile?.lowSodium),
  };
}

function CheckboxField({ defaultChecked, disabled, label, name }) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-xl border border-[var(--color-border)] p-4 font-bold text-[var(--color-text)]">
      <span>{label}</span>
      <input
        className="h-5 w-5 accent-[var(--color-primary)]"
        defaultChecked={defaultChecked}
        disabled={disabled}
        name={name}
        type="checkbox"
      />
    </label>
  );
}
export default function HealthPreferenceCard({ profile, loading, onRefresh }) {
  const defaults = getInitialForm(profile);
  const profileVersion = Object.values(defaults).join(":");

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);

    const physicalPayload = {
      heightCm: formData.get("heightCm") ? Number(formData.get("heightCm")) : null,
      weightKg: formData.get("weightKg") ? Number(formData.get("weightKg")) : null,
      gender: formData.get("gender") || null,
      age: formData.get("age") ? Number(formData.get("age")) : null,
    };

    const conditionPayload = {
      milkAllergy: formData.get("milkAllergy") === "on",
      eggAllergy: formData.get("eggAllergy") === "on",
      diet: formData.get("diet") === "on",
      lowSodium: formData.get("lowSodium") === "on",
    };

    try {
      await Promise.all([
        updatePhysicalMetrics(physicalPayload),
        requestHealthPreferenceSave(conditionPayload),
      ]);
      alert("건강 정보가 저장되었습니다.");
      onRefresh?.();
    } catch (error) {
      alert(`저장 중 오류가 발생했습니다: ${error.message}`);
    }
  };
  return (
    <article className="card-box mt-5">
      <div className="card-body">
        <div className="section-head mb-0">
          <div>
            <h2 className="card-title">건강 정보</h2>
            <p className="card-desc">
              추천 레시피에 활용할 신체 정보와 식단 조건을 관리합니다.
            </p>
          </div>
        </div>

        <form className="mt-5" key={profileVersion} onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="form-group mb-0">
              <span className="form-label">키</span>
              <input
                className="form-input"
                defaultValue={defaults.heightCm}
                disabled={loading}
                inputMode="decimal"
                name="heightCm"
                placeholder="cm"
                type="number"
              />
            </label>

            <label className="form-group mb-0">
              <span className="form-label">몸무게</span>
              <input
                className="form-input"
                defaultValue={defaults.weightKg}
                disabled={loading}
                inputMode="decimal"
                name="weightKg"
                placeholder="kg"
                type="number"
              />
            </label>

            <label className="form-group mb-0">
              <span className="form-label">성별</span>
              <select
                className="form-select"
                defaultValue={defaults.gender}
                disabled={loading}
                name="gender"
              >
                <option value="">선택 안 함</option>
                <option value="FEMALE">여성</option>
                <option value="MALE">남성</option>
                <option value="OTHER">기타</option>
              </select>
            </label>

            <label className="form-group mb-0">
              <span className="form-label">나이</span>
              <input
                className="form-input"
                defaultValue={defaults.age}
                disabled={loading}
                inputMode="numeric"
                name="age"
                placeholder="만 나이"
                type="number"
              />
            </label>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
            <CheckboxField
              defaultChecked={defaults.milkAllergy}
              disabled={loading}
              label="우유 알러지"
              name="milkAllergy"
            />
            <CheckboxField
              defaultChecked={defaults.eggAllergy}
              disabled={loading}
              label="계란 알러지"
              name="eggAllergy"
            />
            <CheckboxField
              defaultChecked={defaults.diet}
              disabled={loading}
              label="다이어트"
              name="diet"
            />
            <CheckboxField
              defaultChecked={defaults.lowSodium}
              disabled={loading}
              label="저염식"
              name="lowSodium"
            />
          </div>

          <div className="card-actions">
            <button
              className="btn btn-secondary"
              disabled={loading}
              type="submit"
            >
              저장
            </button>
          </div>
        </form>
      </div>
    </article>
  );
}
