/**
 * 水滴过渡动画。
 *
 * 流程：
 *  1. 一滴指定颜色的「水滴形」水滴从当前可见屏幕的正上方中央落下；
 *  2. 一直落到屏幕底部中央；
 *  3. 落地瞬间颜色从底部中央向上展开成半圆扇面，铺满整个屏幕（无缝衔接，无停顿）；
 *  4. 铺满后趁界面被遮住切换主题，再整层淡出，露出已经切换好的主题。
 *
 * 电脑端与手机端共用同一套基于 viewport 的实现，效果一致。
 */

let animating = false;

/**
 * 播放水滴过渡动画。
 * @param color       水滴与扇面的颜色
 * @param applyChange 在扇面铺满屏幕之后执行（此时界面已被不透明扇面完全遮住，切换不会被看见）
 * @returns 是否成功开始播放；若已有动画进行中则返回 false 并忽略本次触发
 */
export function playWaterDropTransition(
	color: string,
	applyChange: () => void,
): boolean {
	if (animating) {
		return false;
	}
	animating = true;
	void runTransition(color, applyChange);
	return true;
}

async function runTransition(
	color: string,
	applyChange: () => void,
): Promise<void> {
	const overlay = document.createElement("div");
	overlay.style.cssText =
		"position:fixed;inset:0;z-index:100000;pointer-events:none;overflow:hidden;";

	try {
		const vw = window.innerWidth;
		const vh = window.innerHeight;

		// 水滴大小（正方形边长的一半；手机上略小、桌面上略大）
		const dropRadius = Math.max(
			10,
			Math.min(16, Math.round(Math.min(vw, vh) * 0.03)),
		);
		const dropSize = dropRadius * 2;
		// 水滴尖角/圆端到正方形中心的距离（正方形旋转 45° 后）
		const halfDiag = dropRadius * Math.SQRT2;

		// 扇面是圆心位于「屏幕底部中央」的圆，半径要能盖住最远的角落
		const coverRadius = Math.ceil(Math.hypot(vw / 2, vh) * 1.02);
		// 扇面起始缩放：让扇面最开始的大小与水滴相当，落地瞬间无缝衔接
		const startScale = dropRadius / coverRadius;

		// 水滴：正方形，尖角在左上，旋转 45° 后尖角朝上（水滴形）
		const drop = document.createElement("div");
		drop.style.cssText = [
			"position:fixed",
			"left:50%",
			"top:0",
			`width:${dropSize}px`,
			`height:${dropSize}px`,
			`margin-left:-${dropRadius}px`,
			"border-radius:0 50% 50% 50%",
			`background:${color}`,
			"will-change:transform",
		].join(";");

		// 扇面：圆心在底部中央
		const cover = document.createElement("div");
		cover.style.cssText = [
			"position:fixed",
			"left:50%",
			`top:${vh}px`,
			`width:${coverRadius * 2}px`,
			`height:${coverRadius * 2}px`,
			`margin-left:-${coverRadius}px`,
			`margin-top:-${coverRadius}px`,
			"border-radius:50%",
			`background:${color}`,
			"opacity:0",
			"will-change:transform,opacity",
		].join(";");

		overlay.append(drop, cover);
		document.body.appendChild(overlay);

		// 预热图层，避免扇面首次合成时的卡顿
		void overlay.offsetWidth;

		// 阶段一：水滴从顶部中央落到屏幕底部中央
		// top:0 时正方形中心位于 y=dropRadius；配合 translateY 让水滴初始完全在屏幕上方、
		// 结束时水滴的圆端恰好贴到屏幕底部
		const startY = -(dropRadius + halfDiag);
		const endY = vh - (dropRadius + halfDiag);
		const fall = drop.animate(
			[
				{ transform: `translateY(${startY}px) rotate(45deg)` },
				{ transform: `translateY(${endY}px) rotate(45deg)` },
			],
			{
				duration: 480,
				easing: "cubic-bezier(0.55, 0, 1, 0.45)", // 加速下落，模拟重力
				fill: "forwards",
			},
		);
		await fall.finished;

		// 阶段二：落地瞬间立即向上展开成半圆扇面（无缝衔接）
		drop.style.opacity = "0"; // 水滴并入扇面
		cover.style.opacity = "1";
		const spread = cover.animate(
			[{ transform: `scale(${startScale})` }, { transform: "scale(1)" }],
			{
				duration: 640,
				easing: "cubic-bezier(0.22, 1, 0.36, 1)", // 先快后慢，模拟水花溅开
				fill: "forwards",
			},
		);
		await spread.finished;

		// 阶段三：此刻界面已被不透明扇面完全盖住，禁用过渡后立即切换主题/颜色，
		// 让切换瞬间完成，避免主题过渡延续到淡出之后才完成
		const noTransition = document.createElement("style");
		noTransition.textContent = "*,*::before,*::after{transition:none!important;}";
		document.head.appendChild(noTransition);
		applyChange();
		void document.body.offsetHeight; // 强制重排，让新主题立即生效
		noTransition.remove(); // 恢复过渡

		// 阶段四：淡出，露出已经完全切换好的新主题
		const fade = cover.animate(
			[{ opacity: 1 }, { opacity: 0 }],
			{ duration: 320, easing: "ease-out", fill: "forwards" },
		);
		await fade.finished;
	} catch (err) {
		// 动画被打断时静默处理，不影响功能
		console.warn("水滴过渡动画被打断", err);
	} finally {
		overlay.remove();
		animating = false;
	}
}
