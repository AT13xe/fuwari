<script lang="ts">
import Icon from "@iconify/svelte";
import { AUTO_MODE, DARK_MODE, LIGHT_MODE } from "@constants/constants.ts";
import type { LIGHT_DARK_MODE } from "@/types/config";
import {
	getDefaultHue,
	getHue,
	getStoredTheme,
	setHue,
	setTheme,
} from "@utils/setting-utils";
import { playWaterDropTransition } from "@utils/water-drop";

const defaultHue = getDefaultHue();

let pendingHue = getHue();
let theme = getStoredTheme();

const themeModes: { value: LIGHT_DARK_MODE; icon: string; label: string }[] = [
	{ value: LIGHT_MODE, icon: "material-symbols:light-mode-rounded", label: "明亮" },
	{ value: DARK_MODE, icon: "material-symbols:dark-mode-rounded", label: "暗黑" },
	{ value: AUTO_MODE, icon: "material-symbols:desktop-windows-rounded", label: "自动" },
];

function resetHue() {
	pendingHue = defaultHue;
}

// 主题主色（与 src/styles/variables.styl 中的 --primary 保持一致）
function primaryColor(hue: number): string {
	const isDark = document.documentElement.classList.contains("dark");
	return isDark ? `oklch(0.75 0.14 ${hue})` : `oklch(0.70 0.14 ${hue})`;
}

function changeTheme(mode: LIGHT_DARK_MODE) {
	if (mode === theme) return;
	// 计算切换后的实际明暗，决定水滴颜色：亮=白、暗=黑
	const isDark =
		mode === DARK_MODE ||
		(mode === AUTO_MODE && window.matchMedia("(prefers-color-scheme: dark)").matches);
	// 动画成功开始播放时才更新高亮，实际切换在动画覆盖期间完成
	if (playWaterDropTransition(isDark ? "#000000" : "#ffffff", () => setTheme(mode))) {
		theme = mode;
	}
}

function confirmHue() {
	if (pendingHue === getHue()) return;
	const hue = pendingHue;
	playWaterDropTransition(primaryColor(hue), () => setHue(hue));
}
</script>

<div id="display-setting" class="float-panel float-panel-closed absolute transition-all w-80 right-4 px-4 py-4">
	<!-- 明暗模式 -->
	<div class="flex gap-2 font-bold text-lg text-neutral-900 dark:text-neutral-100 transition relative ml-3 mb-3
		before:w-1 before:h-4 before:rounded-md before:bg-[var(--primary)]
		before:absolute before:-left-3 before:top-[0.33rem]">
		明暗模式
	</div>
	<div class="flex gap-2 mb-4">
		{#each themeModes as m (m.value)}
			<button
				aria-label={m.label}
				title={m.label}
				class="theme-mode-btn"
				class:theme-mode-active={theme === m.value}
				on:click={() => changeTheme(m.value)}
			>
				<Icon icon={m.icon} class="text-[1.1rem]" />
				<span>{m.label}</span>
			</button>
		{/each}
	</div>

	<!-- 主题色彩 -->
	<div class="flex flex-row gap-2 mb-3 items-center justify-between">
		<div class="flex gap-2 font-bold text-lg text-neutral-900 dark:text-neutral-100 transition relative ml-3
			before:w-1 before:h-4 before:rounded-md before:bg-[var(--primary)]
			before:absolute before:-left-3 before:top-[0.33rem]">
			主题色彩
			<button aria-label="Reset to Default" class="btn-regular w-7 h-7 rounded-md active:scale-90"
				class:opacity-0={pendingHue === defaultHue} class:pointer-events-none={pendingHue === defaultHue}
				on:click={resetHue}>
				<div class="text-[var(--btn-content)]">
					<Icon icon="fa6-solid:arrow-rotate-left" class="text-[0.875rem]"></Icon>
				</div>
			</button>
		</div>
		<div class="flex gap-1">
			<div id="hueValue" class="transition bg-[var(--btn-regular-bg)] w-10 h-7 rounded-md flex justify-center
				font-bold text-sm items-center text-[var(--btn-content)]">
				{pendingHue}
			</div>
		</div>
	</div>
	<div class="w-full h-6 px-1 bg-[oklch(0.80_0.10_0)] dark:bg-[oklch(0.70_0.10_0)] rounded select-none">
		<input aria-label="主题色彩" type="range" min="0" max="360" bind:value={pendingHue}
			class="slider" id="colorSlider" step="5" style="width: 100%">
	</div>

	<!-- 确认 -->
	<button class="btn-regular w-full h-9 rounded-md mt-4 font-bold" on:click={confirmHue}>
		确认
	</button>
</div>

<style lang="stylus">
	#display-setting
		input[type="range"]
			-webkit-appearance none
			height 1.5rem
			background-image var(--color-selection-bar)
			transition background-image 0.15s ease-in-out

			/* Input Thumb */
			&::-webkit-slider-thumb
				-webkit-appearance none
				height 1rem
				width 0.5rem
				border-radius 0.125rem
				background rgba(255, 255, 255, 0.7)
				box-shadow none
				&:hover
					background rgba(255, 255, 255, 0.8)
				&:active
					background rgba(255, 255, 255, 0.6)

			&::-moz-range-thumb
				-webkit-appearance none
				height 1rem
				width 0.5rem
				border-radius 0.125rem
				border-width 0
				background rgba(255, 255, 255, 0.7)
				box-shadow none
				&:hover
					background rgba(255, 255, 255, 0.8)
				&:active
					background rgba(255, 255, 255, 0.6)

			&::-ms-thumb
				-webkit-appearance none
				height 1rem
				width 0.5rem
				border-radius 0.125rem
				background rgba(255, 255, 255, 0.7)
				box-shadow none
				&:hover
					background rgba(255, 255, 255, 0.8)
				&:active
					background rgba(255, 255, 255, 0.6)

	.theme-mode-btn
		display flex
		flex 1
		align-items center
		justify-content center
		gap 0.375rem
		height 2.25rem
		border-radius 0.5rem
		font-size 0.8rem
		font-weight 600
		background var(--btn-regular-bg)
		color var(--btn-content)
		transition background 0.15s ease-in-out, color 0.15s ease-in-out

		&:hover
			background var(--btn-regular-bg-hover)

		&:active
			background var(--btn-regular-bg-active)

	.theme-mode-active
		background var(--primary)
		color #fff

		&:hover
			background var(--primary)
</style>
