import type { APIRoute } from "astro";
import { getSortedAnnouncements } from "@utils/announcement-utils";

/**
 * 构建时生成的静态数据：未读提醒脚本会请求它来获取最新公告列表。
 * 每次新增公告并重新部署后，这里的 total / ids 会自动更新。
 */
export const GET: APIRoute = async () => {
	const announcements = await getSortedAnnouncements();
	const payload = {
		total: announcements.length,
		ids: announcements.map((entry) => entry.slug),
	};

	return new Response(JSON.stringify(payload), {
		headers: {
			"Content-Type": "application/json; charset=utf-8",
			"Cache-Control": "no-cache",
		},
	});
};
