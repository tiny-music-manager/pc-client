import './index.scss'
import React from "react"

interface IFilterProps {
	className?: string
	style?: React.CSSProperties,
	items: Array<{ key: string, value: string }>
	selected?: string
	onChange?: (key: string) => any
}

export class Filter extends React.Component<IFilterProps> {
	render() {
		return (
			<div className={`tmm-filter ${this.props.className ?? ''}`} style={this.props.style}>
				{this.props.items.map(item => <div key={item.key} className={this.props.selected === item.key ? 'active' : ''} onClick={() => this.props.onChange?.(item.key)}>{item.value}</div>)}
			</div>
		)
	}
}