import './index.scss'
import React, { createRef } from "react"

interface ISelectProps {
	mult?: boolean
	value?: Array<string | number>
	onSelect?: (val: Array<string | number>) => any
}

interface ISelectOptionProps {
	key: string | number
	// value: string | number
}

class SelectOption extends React.Component<ISelectOptionProps> {

	render() {
		return (
			<div className="option">{this.props.children}</div>
		)
	}
}

export class Select extends React.Component<ISelectProps> {
	public static Option = SelectOption
	private optionContainer = createRef<HTMLDivElement>()

	handleHideOptions() {
		if (this.optionContainer.current) this.optionContainer.current.style.display = 'none'
	}

	componentWillUnmount() {
		window.removeEventListener('click', this.handleHideOptions.bind(this))
	}

	componentDidMount() {
		window.addEventListener('click', this.handleHideOptions.bind(this))

		const initChildren = (dom: HTMLDivElement, key: string | number) => {
			dom.onclick = (e) => {
				e.stopPropagation()
				const { mult, value, onSelect } = this.props
				if (!onSelect) return
				if (mult) {
					const val = [...value ?? []]
					if (!val.includes(key)) val.push(key)
					else {
						for (let i = 0; i < val.length; ++i) {
							if (val[i] == key) {
								val.splice(i, 1)
								break
							}
						}
					}
					onSelect(val)
				}
				else {
					onSelect([key])
				}

			}
		}

		if (this.optionContainer.current) {
			const dom = this.optionContainer.current
			for (let i = 0; i < dom.children.length; ++i) {
				initChildren(dom.children[i] as HTMLDivElement, (this.props.children as any)?.[i].key ?? '')
			}
		}
	}

	render() {
		return (
			<div className="select">
				<div className="label" onClick={(e) => {
					e.stopPropagation()
					if (this.optionContainer.current) this.optionContainer.current.style.display = ''
				}}>周杰伦</div>
				<div className="options" ref={this.optionContainer}>
					{this.props.children}
				</div>
			</div>
		)
	}
}