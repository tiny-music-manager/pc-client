import { createBrowserHistory } from "history"

export const consts = {
	get apiURL() {
		return nativeApi?.appdata?.getNetworkAddress?.()?.current
	},
	get localURL() {
		return nativeApi?.webUrl ?? ''
	}
}

//分组中元素间距
export const groupItemPadding = 20

//颜色字典
export const colorDict = [
	['#009688', '#00897b'],
	['#4caf50', '#43a047'],
	['#f44336', '#d32f2f'],
	['#e91e63', '#c2185b'],
	['#9c27b0', '#7b1fa2'],
	['#673ab7', '#512da8'],
	['#3f51b5', '#303f9f'],
	['#2196f3', '#1976d2'],
	['#03a9f4', '#0288d1'],
	['#00bcd4', '#0097a7'],
	['#8bc34a', '#689f38'],
	['#cddc39', '#afb42b'],
	['#ffc107', '#ffa000'],
	['#ff5722', '#d84315'],
	['#795548', '#5d4037'],
	['#607d8b', '#455a64'],
]

//重写的history
export const history = (() => {
	const history = createBrowserHistory()
	const first: string = window.history.state.key
	let last: string = window.history.state.key
	return {
		history,
		listen: history.listen,
		forward() {
			if (this.isLast) return
			history.go(1)
		},
		back() {
			if (this.isFirst) return
			history.go(-1)
		},
		push(pathname: string) {
			history.push(pathname)
			last = this.currentKey
		},
		get location() {
			return history.location
		},
		get currentKey() {
			return window.history.state.key as string
		},
		get isLast() {
			return last == this.currentKey
		},
		get isFirst() {
			return first == this.currentKey
		}
	}
})()


//分类字典
export const kindDict: { [i: string]: string } = {
	years: '年代',
	mood: '心情',
	scene: '场景',
	sect: '流派',
	language: '语种',
	theme: '主题',
}
