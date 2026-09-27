import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";
import {
  EmptyState,
  ErrorState,
  LoadingTable,
} from "@/components/admin/AsyncState";
import Pagination from "@/components/admin/Pagination";
import ProfileFormModal from "@/components/admin/ProfileFormModal";
import ProfileHistoryModal from "@/components/admin/ProfileHistoryModal";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import PageMeta from "@/components/common/PageMeta";
import NetworkFilters from "@/components/profiles/NetworkFilters";
import ProfileAvatar from "@/components/profiles/ProfileAvatar";
import Badge from "@/components/ui/badge/Badge";
import { listProfiles, profileKeys } from "@/features/profiles/api";
import {
  DineeCloseIcon,
  DineeCompanyIcon,
  DineeEditIcon,
  DineeHistoryIcon,
  DineeMailIcon,
  DineePhoneIcon,
  DineePlusIcon,
  DineeResetIcon,
} from "@/icons";
import type { Availability, Profile } from "@/types/dinee";

const availabilityColor: Record<Availability, "light" | "success" | "warning"> =
  {
    unspecified: "light",
    available: "success",
    temporarily_unavailable: "warning",
  };

export default function NetworkPage() {
  const { t } = useTranslation();
  const client = useQueryClient();
  const [params, setParams] = useSearchParams();
  const [formOpen, setFormOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [historyProfile, setHistoryProfile] = useState<Profile | null>(null);
  const [notice, setNotice] = useState("");
  const filters = {
    q: params.get("q") ?? "",
    availability: (params.get("availability") ?? "") as Availability | "",
    page: Math.max(1, Number(params.get("page") ?? 1)),
    perPage: 20,
  };
  const query = useQuery({
    queryKey: profileKeys.list(filters),
    queryFn: () => listProfiles(filters),
  });
  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== "page") next.delete("page");
    setParams(next);
  };
  const resetFilters = () => setParams({});
  const openCreate = () => {
    setEditingProfile(null);
    setFormOpen(true);
  };
  const openEdit = (profile: Profile) => {
    setEditingProfile(profile);
    setFormOpen(true);
  };
  const saved = async (profile: Profile) => {
    setFormOpen(false);
    setEditingProfile(null);
    setNotice(
      t("dinee.profileSaved", {
        name: `${profile.first_name} ${profile.last_name}`,
      }),
    );
    await client.invalidateQueries({ queryKey: profileKeys.all });
  };
  const hasFilters = Boolean(filters.q || filters.availability);
  const professionalSummary = (profile: Profile) =>
    [profile.job_title, profile.company].filter(Boolean).join(" · ") ||
    t("dinee.noProfessionalDetails");

  return (
    <>
      <PageMeta
        title={`${t("dinee.networkTitle")} | ${t("dinee.brand")}`}
        description={t("dinee.networkSubtitle")}
      />
      <PageBreadCrumb pageTitle={t("dinee.networkTitle")} />
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <p className="max-w-2xl text-sm text-gray-500 dark:text-gray-400">
          {t("dinee.networkSubtitle")}
        </p>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
        >
          <DineePlusIcon aria-hidden="true" className="size-5" />
          {t("dinee.newProfile")}
        </button>
      </div>

      {notice && (
        <div
          role="status"
          className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-success-200 bg-success-50 px-4 py-3 text-sm text-success-700 dark:border-success-500/30 dark:bg-success-500/15 dark:text-success-300"
        >
          <span>{notice}</span>
          <button
            type="button"
            onClick={() => setNotice("")}
            aria-label={t("dinee.close")}
            className="flex size-8 shrink-0 items-center justify-center rounded-lg hover:bg-success-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-success-600 dark:hover:bg-success-500/15"
          >
            <DineeCloseIcon aria-hidden="true" className="size-4" />
          </button>
        </div>
      )}

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-white/3">
        <NetworkFilters
          q={filters.q}
          availability={filters.availability}
          hasFilters={hasFilters}
          onChange={updateParam}
          onReset={resetFilters}
        />
        {query.isPending ? (
          <LoadingTable />
        ) : query.isError ? (
          <ErrorState onRetry={() => query.refetch()} />
        ) : query.data.data.length === 0 ? (
          <EmptyState
            title={t("dinee.noProfiles")}
            description={t(
              hasFilters
                ? "dinee.noFilteredProfilesDescription"
                : "dinee.noProfilesDescription",
            )}
            action={
              hasFilters ? (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-gray-300 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
                >
                  <DineeResetIcon aria-hidden="true" className="size-4" />
                  {t("dinee.reset")}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={openCreate}
                  className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-brand-500 px-4 text-sm font-medium text-white hover:bg-brand-600"
                >
                  <DineePlusIcon aria-hidden="true" className="size-4" />
                  {t("dinee.newProfile")}
                </button>
              )
            }
          />
        ) : (
          <>
            <div className="divide-y divide-gray-100 sm:hidden dark:divide-gray-800">
              {query.data.data.map((profile) => (
                <article key={profile.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <ProfileAvatar
                      firstName={profile.first_name}
                      lastName={profile.last_name}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-semibold text-gray-800 dark:text-white/90">
                          {profile.first_name} {profile.last_name}
                        </h2>
                        <Badge
                          color={profile.has_account ? "success" : "light"}
                          size="sm"
                        >
                          {t(
                            profile.has_account
                              ? "dinee.accountActive"
                              : "dinee.noAccount",
                          )}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm leading-5 text-gray-500 dark:text-gray-400">
                        {professionalSummary(profile)}
                      </p>
                      {profile.sector && (
                        <p className="mt-1 text-theme-xs text-gray-400 dark:text-gray-500">
                          {profile.sector}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-3 rounded-lg bg-gray-50 px-3 py-2 dark:bg-white/3">
                    <span className="text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                      {t("dinee.availability")}
                    </span>
                    <Badge
                      color={availabilityColor[profile.availability]}
                      size="sm"
                    >
                      {t(`dinee.availability_${profile.availability}`)}
                    </Badge>
                  </div>
                  {(profile.email || profile.phone) && (
                    <div className="mt-4 space-y-2">
                      {profile.email && (
                        <a
                          href={`mailto:${profile.email}`}
                          className="flex min-h-10 items-center gap-2 rounded-lg px-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 dark:text-gray-300 dark:hover:bg-white/5 dark:hover:text-brand-400"
                        >
                          <DineeMailIcon
                            aria-hidden="true"
                            className="size-4 text-gray-400"
                          />
                          <span className="min-w-0 truncate">
                            {profile.email}
                          </span>
                        </a>
                      )}
                      {profile.phone && (
                        <a
                          href={`tel:${profile.phone}`}
                          className="flex min-h-10 items-center gap-2 rounded-lg px-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 dark:text-gray-300 dark:hover:bg-white/5 dark:hover:text-brand-400"
                        >
                          <DineePhoneIcon
                            aria-hidden="true"
                            className="size-4 text-gray-400"
                          />
                          {profile.phone}
                        </a>
                      )}
                    </div>
                  )}
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setHistoryProfile(profile)}
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-gray-300 px-3 text-sm font-medium text-gray-700 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 dark:border-gray-700 dark:text-gray-300 dark:hover:border-brand-500/50 dark:hover:bg-brand-500/10"
                    >
                      <DineeHistoryIcon aria-hidden="true" className="size-4" />
                      {t("dinee.history")}
                    </button>
                    <button
                      type="button"
                      onClick={() => openEdit(profile)}
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-gray-300 px-3 text-sm font-medium text-gray-700 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 dark:border-gray-700 dark:text-gray-300 dark:hover:border-brand-500/50 dark:hover:bg-brand-500/10"
                    >
                      <DineeEditIcon aria-hidden="true" className="size-4" />
                      {t("dinee.edit")}
                    </button>
                  </div>
                </article>
              ))}
            </div>

            <div className="hidden overflow-x-auto sm:block">
              <table className="min-w-full">
                <thead className="border-b border-gray-100 bg-gray-50/80 dark:border-gray-800 dark:bg-gray-900/50">
                  <tr>
                    {[
                      "person",
                      "professionalInformation",
                      "contact",
                      "availability",
                      "actions",
                    ].map((key) => (
                      <th
                        key={key}
                        scope="col"
                        className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 uppercase dark:text-gray-400"
                      >
                        {t(`dinee.${key}`)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {query.data.data.map((profile) => (
                    <tr
                      key={profile.id}
                      className="hover:bg-gray-50/70 dark:hover:bg-white/2"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <ProfileAvatar
                            firstName={profile.first_name}
                            lastName={profile.last_name}
                            size="sm"
                          />
                          <div className="min-w-0">
                            <p className="font-medium text-gray-800 dark:text-white/90">
                              {profile.first_name} {profile.last_name}
                            </p>
                            <div className="mt-1 flex flex-wrap items-center gap-2">
                              <Badge
                                color={
                                  profile.has_account ? "success" : "light"
                                }
                                size="sm"
                              >
                                {t(
                                  profile.has_account
                                    ? "dinee.accountActive"
                                    : "dinee.noAccount",
                                )}
                              </Badge>
                              {profile.sector && (
                                <span className="text-theme-xs text-gray-500 dark:text-gray-400">
                                  {profile.sector}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          {profile.job_title || "—"}
                        </p>
                        <p className="mt-1 inline-flex items-center gap-1.5 text-theme-xs text-gray-500 dark:text-gray-400">
                          <DineeCompanyIcon
                            aria-hidden="true"
                            className="size-3.5"
                          />
                          {profile.company || "—"}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <div className="space-y-1.5">
                          {profile.email ? (
                            <a
                              href={`mailto:${profile.email}`}
                              className="flex items-center gap-2 text-sm text-gray-600 hover:text-brand-600 dark:text-gray-300 dark:hover:text-brand-400"
                            >
                              <DineeMailIcon
                                aria-hidden="true"
                                className="size-4 text-gray-400"
                              />
                              <span className="max-w-52 truncate">
                                {profile.email}
                              </span>
                            </a>
                          ) : (
                            <span className="text-sm text-gray-400">—</span>
                          )}
                          {profile.phone && (
                            <a
                              href={`tel:${profile.phone}`}
                              className="flex items-center gap-2 text-theme-xs text-gray-500 hover:text-brand-600 dark:text-gray-400 dark:hover:text-brand-400"
                            >
                              <DineePhoneIcon
                                aria-hidden="true"
                                className="size-4 text-gray-400"
                              />
                              {profile.phone}
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <Badge color={availabilityColor[profile.availability]}>
                          {t(`dinee.availability_${profile.availability}`)}
                        </Badge>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setHistoryProfile(profile)}
                            aria-label={t("dinee.viewHistoryNamed", {
                              name: `${profile.first_name} ${profile.last_name}`,
                            })}
                            title={t("dinee.history")}
                            className="flex size-10 items-center justify-center rounded-lg text-gray-500 hover:bg-brand-50 hover:text-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 dark:text-gray-400 dark:hover:bg-brand-500/10 dark:hover:text-brand-400"
                          >
                            <DineeHistoryIcon
                              aria-hidden="true"
                              className="size-5"
                            />
                          </button>
                          <button
                            type="button"
                            onClick={() => openEdit(profile)}
                            aria-label={t("dinee.editNamedProfile", {
                              name: `${profile.first_name} ${profile.last_name}`,
                            })}
                            title={t("dinee.edit")}
                            className="flex size-10 items-center justify-center rounded-lg text-gray-500 hover:bg-brand-50 hover:text-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 dark:text-gray-400 dark:hover:bg-brand-500/10 dark:hover:text-brand-400"
                          >
                            <DineeEditIcon
                              aria-hidden="true"
                              className="size-5"
                            />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              meta={query.data.meta}
              onPageChange={(page) => updateParam("page", String(page))}
            />
          </>
        )}
      </section>
      {formOpen && (
        <ProfileFormModal
          isOpen
          profile={editingProfile}
          onClose={() => setFormOpen(false)}
          onSaved={saved}
        />
      )}
      <ProfileHistoryModal
        profile={historyProfile}
        onClose={() => setHistoryProfile(null)}
      />
    </>
  );
}
