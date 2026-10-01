import { getCollection, type CollectionEntry } from "astro:content";

export type AnnouncementEntry = CollectionEntry<"announcement">;

/**
 * 公告文件名建议为 1.md、2.md……数字越大代表发布越晚。
 * 当多条公告的 published 完全相同时，用它做稳定的兜底排序。
 */
export function getAnnouncementNumber(slug: string): number {
	const matched = slug.match(/\d+/);
	return matched ? Number.parseInt(matched[0], 10) : 0;
}

/** 公告按发布时间从新到旧排序 */
export async function getSortedAnnouncements(): Promise<AnnouncementEntry[]> {
	const allAnnouncements = await getCollection("announcement", ({ data }) => {
		return import.meta.env.PROD ? data.draft !== true : true;
	});

	return allAnnouncements.sort((a, b) => {
		const dateA = new Date(a.data.published).getTime();
		const dateB = new Date(b.data.published).getTime();
		if (dateA !== dateB) {
			return dateB - dateA;
		}
		return getAnnouncementNumber(b.slug) - getAnnouncementNumber(a.slug);
	});
}
