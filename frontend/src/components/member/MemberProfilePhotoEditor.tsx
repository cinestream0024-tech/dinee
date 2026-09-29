import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { apiErrorMessageKey } from "@/components/admin/apiErrors";
import ProfileAvatar from "@/components/profiles/ProfileAvatar";
import {
  memberProfileKey,
  removeMemberProfilePhoto,
  uploadMemberProfilePhoto,
} from "@/features/profiles/api";
import type { Profile } from "@/types/dinee";

const acceptedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const maxBytes = 5 * 1024 * 1024;

export default function MemberProfilePhotoEditor({
  profile,
}: {
  profile: Profile;
}) {
  const { t } = useTranslation();
  const client = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [clientError, setClientError] = useState("");
  const [notice, setNotice] = useState("");
  const [confirmingRemoval, setConfirmingRemoval] = useState(false);
  const upload = useMutation({
    mutationFn: uploadMemberProfilePhoto,
    onSuccess: (updatedProfile) => {
      client.setQueryData(memberProfileKey, updatedProfile);
      setNotice(t("dinee.photoUpdated"));
    },
  });
  const remove = useMutation({
    mutationFn: removeMemberProfilePhoto,
    onSuccess: (updatedProfile) => {
      client.setQueryData(memberProfileKey, updatedProfile);
      setNotice(t("dinee.photoRemoved"));
      setConfirmingRemoval(false);
    },
  });
  const busy = upload.isPending || remove.isPending;
  const requestError = upload.error ?? remove.error;

  const choosePhoto = (file?: File) => {
    if (!file) return;
    setClientError("");
    setNotice("");
    setConfirmingRemoval(false);
    upload.reset();
    remove.reset();

    if (!acceptedTypes.has(file.type)) {
      setClientError(t("dinee.invalidPhoto"));
      return;
    }
    if (file.size > maxBytes) {
      setClientError(t("dinee.photoTooLarge"));
      return;
    }

    upload.mutate(file);
  };

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <ProfileAvatar
          firstName={profile.first_name}
          lastName={profile.last_name}
          photoUrl={profile.photo_url}
          size="lg"
        />
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            {t("dinee.profilePhoto")}
          </h2>
          <p className="mt-1 text-sm leading-6 text-gray-500 dark:text-gray-400">
            {t("dinee.profilePhotoHint")}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
              className="sr-only"
              aria-label={t(
                profile.photo_url ? "dinee.changePhoto" : "dinee.addPhoto",
              )}
              onChange={(event) => {
                choosePhoto(event.target.files?.[0]);
                event.target.value = "";
              }}
            />
            <button
              type="button"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-brand-500 px-4 text-sm font-medium text-white hover:bg-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {upload.isPending
                ? t("dinee.uploadingPhoto")
                : t(profile.photo_url ? "dinee.changePhoto" : "dinee.addPhoto")}
            </button>
            {profile.photo_url && (
              <button
                type="button"
                disabled={busy}
                onClick={() => setConfirmingRemoval(true)}
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                {remove.isPending
                  ? t("dinee.removingPhoto")
                  : t("dinee.removePhoto")}
              </button>
            )}
          </div>
          {confirmingRemoval && (
            <div
              role="alertdialog"
              aria-labelledby="photo-removal-title"
              aria-describedby="photo-removal-description"
              className="mt-4 rounded-xl border border-error-200 bg-error-25 p-4 dark:border-error-900/60 dark:bg-error-950/30"
            >
              <p
                id="photo-removal-title"
                className="text-sm font-semibold text-gray-900 dark:text-white"
              >
                {t("dinee.confirmPhotoRemoval")}
              </p>
              <p
                id="photo-removal-description"
                className="mt-1 text-sm text-gray-600 dark:text-gray-400"
              >
                {t("dinee.confirmPhotoRemovalDescription")}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setConfirmingRemoval(false)}
                  className="inline-flex min-h-11 items-center justify-center rounded-xl border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  {t("dinee.cancel")}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    setClientError("");
                    setNotice("");
                    upload.reset();
                    remove.reset();
                    remove.mutate();
                  }}
                  className="inline-flex min-h-11 items-center justify-center rounded-xl bg-error-600 px-4 text-sm font-medium text-white hover:bg-error-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-error-500 disabled:opacity-60"
                >
                  {remove.isPending
                    ? t("dinee.removingPhoto")
                    : t("dinee.confirmRemoval")}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {(clientError || requestError) && (
        <p
          role="alert"
          className="mt-4 text-sm text-error-600 dark:text-error-400"
        >
          {clientError || t(apiErrorMessageKey(requestError))}
        </p>
      )}
      {notice && (
        <p
          role="status"
          className="mt-4 text-sm text-success-700 dark:text-success-400"
        >
          {notice}
        </p>
      )}
    </section>
  );
}
