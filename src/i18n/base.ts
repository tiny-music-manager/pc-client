export type TI18nLang = 'zh' | 'en'

const lang: TI18nLang = 'zh'

class I18nInfo {
	#info: { [k in TI18nLang]?: string } = {}

	public add(lang: TI18nLang, str: string) {
		this.#info[lang] = str
		return this
	}

	public get string() {
		let s = this.#info[lang]
		if (s === null || s === undefined) {
			s = Object.keys(this.#info).filter(key => !!(this.#info as any)[key])[0] ?? ''
		}
		return s
	}
}


export function i18ndef(lang: TI18nLang, str: string) {
	return new I18nInfo().add(lang, str)
}