import { consts } from "./consts"
import { Page } from "./page"

type Clazz<T> = new (...args: Array<any>) => T

interface IDialogConfig {
	/** 对话框名称，唯一 */
	name: string
	/** 窗口宽度 */
	width: number
	/** 窗口高度 */
	height: number
	/** 开发模式 */
	dev?: boolean
}

/**
 * 定义页面
 * @param Props props类型的定义
 * @param States state类型的定义
 * @param Env 环境定义
 */
export class Dialog<Data, Result, Props = {}, States = {}> extends Page<Props, States, {}> {
	public static config: IDialogConfig

	#env = nativeApi.env

	/**
	 * 打开对话框窗口，并等待窗口返回
	 * @param data 传递的参数
	 */
	public static open<D, R>(this: Clazz<Dialog<D, R>>, data: D) {

		const that = this as any as typeof Dialog

		return new Promise<R>((resolve, reject) => {
			if (!that.config) reject(new Error(`${that.name}缺少config`))

			const win = nativeApi.window.createWindow({
				width: (that.config.width ?? 800) + (that.config.dev ? 800 : 0),
				height: that.config.height ?? 600,
				modal: true,

				...that.config.dev ? {} : { resizable: false, fullscreenable: false, frame: false },

				env: { data },
			})

			win.onExit(data => resolve(data))
			win.openURL(`${consts.localURL}/dialog/${that.config.name}`)
		})
	}

	/**
	 * 退出窗口
	 * @param data 返回的数据
	 */
	protected exit(data: Result | null) {
		nativeApi.window.closeWindow(data)
	}

	/**
	 * 窗口数据
	 */
	protected get data(): Data {
		return this.#env.data
	}

}