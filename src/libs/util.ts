import { colorDict, groupItemPadding } from "./consts"

export namespace util {
	export function groupData<T>(width: number, data: Array<T>, pwidth: number = 1) {
		const result: Array<Array<T>> = []
		let count = 0
		let itemWidth = 0

		if (data && width) {
			count = parseInt(width / (200 * pwidth) + 1 as any)										//每组数量
			const gcount = parseInt(Math.max((data.length + count - 1) / count, 1) as any)	//组数量
			itemWidth = ((width - groupItemPadding * (count - 1)) / count)

			for (let i = 0; i < gcount; i++) {
				const group: Array<T> = []
				for (let j = 0; j < count; j++) {
					const index = i * count + j
					if (index <= data.length - 1) group.push(data[index])
				}
				result.push(group)
			}
		}

		return { result, count, itemWidth }
	}


	export function getBackground(image: string | null | undefined, name: string) {
		if (image) return `url(${image})`
		const index = (name || '0').charCodeAt(0) % colorDict.length
		const [from, to] = colorDict[index]
		return `linear-gradient(to right, ${from}, ${to})`
	}

	//时长转换为xx:xx
	export function durationStr(duration: number) {
		const m = parseInt(duration / 60 as any)
		const s = parseInt(duration % 60 as any)
		if (isNaN(m) || isNaN(s)) return '00:00'
		return `${(m + '').padStart(2, '0')}:${(s + '').padStart(2, '0')}`
	}

	export function arrayBufferToBase64(buffer: ArrayBuffer) {
		var binary = '';
		var bytes = new Uint8Array(buffer);
		var len = bytes.byteLength;
		for (var i = 0; i < len; i++) {
			binary += String.fromCharCode(bytes[i]);
		}
		return window.btoa(binary);
	}
}