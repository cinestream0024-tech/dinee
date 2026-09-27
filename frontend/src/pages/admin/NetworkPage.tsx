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
import { controlClass } from "@/components/admin/formStyles";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import PageMeta from "@/components/common/PageMeta";
import Badge from "@/components/ui/badge/Badge";
import { listProfiles, profileKeys } from "@/features/profiles/api";
import { ClockIcon, PencilIcon, PlusIcon, SearchIcon } from "@/icons";
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

  const resetFilters = () => {
    setParams({});
  };
  const hasFilters = Boolean(filters.q || filters.availability);

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
          <PlusIcon className="size-5" />
          {t("dinee.newProfile")}
        </button>
      </div>

      {notice && (
        <div
          role="status"
          className="mb-4 rounded-lg border border-success-200 bg-success-50 px-4 py-3 text-sm text-success-700 dark:border-success-500/30 dark:bg-success-500/15 dark:text-success-300"
        >
          {notice}
        </div>
      )}

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/3">
        <div className="border-b border-gray-100 p-4 sm:p-5 dark:border-gray-800">
          <form
            className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(14rem,1fr)_16rem_auto]"
            onSubmit={(event) => {
              event.preventDefault();
              const data = new FormData(event.currentTarget);
              updateParam("q", String(data.get("q") ?? "").trim());
            }}
          >
            <label className="relative block">
              <span className="sr-only">{t("dinee.searchNetwork")}</span>
              <SearchIcon className="pointer-events-none absolute start-3 top-1/2 size-5 -translate-y-1/2 text-gray-400" />
              <input
                key={filters.q}
                name="q"
                defaultValue={filters.q}
                placeholder={t("dinee.searchNetwork")}
                className={`${controlClass()} ps-10`}
              />
            </label>
            <label>
              <span className="sr-only">{t("dinee.availability")}</span>
              <select
                value={filters.availability}
                onChange={(event) =>
                  updateParam("availability", event.target.value)
                }
                className={controlClass()}
              >
                <option value="">{t("dinee.allAvailability")}</option>
                <option value="available">
                  {t("dinee.availability_available")}
                </option>
                <option value="temporarily_unavailable">
                  {t("dinee.availability_temporarily_unavailable")}
                </option>
                <option value="unspecified">
                  {t("dinee.availability_unspecified")}
                </option>
              </select>
            </label>
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 rounded-lg bg-gray-800 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-700 dark:bg-white/10 dark:hover:bg-white/15"
              >
                {t("dinee.search")}
              </button>
              {hasFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
                >
                  {t("dinee.reset")}
                </button>
              )}
            </div>
          </form>
        </div>

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
              !hasFilters ? (
                <button
                  type="button"
                  onClick={openCreate}
                  className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600"
                >
                  {t("dinee.newProfile")}
                </button>
              ) : undefined
            }
          />
        ) : (
          <>
            <div className="divide-y divide-gray-100 sm:hidden dark:divide-gray-800">
              {query.data.data.map((profile) => (
                <article key={profile.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="font-semibold text-gray-800 dark:text-white/90">
                        {profile.first_name} {profile.last_name}
                      </h2>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        {[profile.job_title, profile.company]
                          .filter(Boolean)
                          .join(" · ") || t("dinee.noProfessionalDetails")}
                      </p>
                    </div>
                    <Badge color={availabilityColor[profile.availability]}>
                      {t(`dinee.availability_${profile.availability}`)}
                    </Badge>
                  </div>
                  <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <dt className="text-gray-500 dark:text-gray-400">
                        {t("dinee.email")}
                      </dt>
                      <dd className="mt-1 break-all text-gray-800 dark:text-white/90">
                        {profile.email || "—"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-gray-500 dark:text-gray-400">
                        {t("dinee.phone")}
                      </dt>
                      <dd className="mt-1 text-gray-800 dark:text-white/90">
                        {profile.phone || "—"}
                      </dd>
                    </div>
                  </dl>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setHistoryProfile(profile)}
                      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 dark:border-gray-700 dark:text-gray-300"
                    >
                      <ClockIcon className="size-4" />
                      {t("dinee.history")}
                    </button>
                    <button
                      type="button"
                      onClick={() => openEdit(profile)}
                      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 dark:border-gray-700 dark:text-gray-300"
                    >
                      <PencilIcon className="size-4" />
                      {t("dinee.edit")}
                    </button>
                  </div>
                </article>
              ))}
            </div>

            <div className="hidden overflow-x-auto sm:block">
              <table className="min-w-full">
                <thead className="border-b border-gray-100 bg-gray-50 dark:border-gray-800 dark:bg-gray-900/50">
                  <tr>
                    {[
                      "person",
                      "professionalInformation",
                      "contact",
                      "availability",
                      "account",
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
                        <p className="font-medium text-gray-800 dark:text-white/90">
                          {profile.first_name} {profile.last_name}
                        </p>
                        <p className="mt-1 text-theme-xs text-gray-500 dark:text-gray-400">
                          {profile.sector || "—"}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          {profile.job_title || "—"}
                        </p>
                        <p className="mt-1 text-theme-xs text-gray-500 dark:text-gray-400">
                          {profile.company || "—"}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          {profile.email || "—"}
                        </p>
                        <p className="mt-1 text-theme-xs text-gray-500 dark:text-gray-400">
                          {profile.phone || "—"}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <Badge color={availabilityColor[profile.availability]}>
                          {t(`dinee.availability_${profile.availability}`)}
                        </Badge>
                      </td>
                      <td className="px-5 py-4">
                        <Badge
                          color={profile.has_account ? "success" : "light"}
                        >
                          {t(
                            profile.has_account
                              ? "dinee.accountActive"
                              : "dinee.noAccount",
                          )}
                        </Badge>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setHistoryProfile(profile)}
                            aria-label={t("dinee.viewHistoryNamed", {
                              name: `${profile.first_name} ${profile.last_name}`,
                            })}
                            className="flex size-10 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-brand-600 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-brand-400"
                          >
                            <ClockIcon className="size-5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openEdit(profile)}
                            aria-label={t("dinee.editNamedProfile", {
                              name: `${profile.first_name} ${profile.last_name}`,
                            })}
                            className="flex size-10 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-brand-600 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-brand-400"
                          >
                            <PencilIcon className="size-5" />
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
