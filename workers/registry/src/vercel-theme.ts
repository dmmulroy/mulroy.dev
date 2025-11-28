import type { ThemeRegistration } from 'shiki';

const vercelTheme: ThemeRegistration = {
	name: 'vercel',
	type: 'dark',
	colors: {
		'editor.background': '#000000',
		'editor.foreground': '#eeeeee',
	},
	tokenColors: [
		{
			scope: ['comment', 'punctuation.definition.comment'],
			settings: {
				foreground: '#a0a0a0',
				fontStyle: 'italic',
			},
		},
		{
			scope: ['string', 'string.quoted', 'string.template'],
			settings: {
				foreground: '#00cb50',
			},
		},
		{
			scope: [
				'keyword',
				'keyword.control',
				'keyword.operator',
				'storage',
				'storage.type',
				'storage.modifier',
			],
			settings: {
				foreground: '#ff4d8d',
			},
		},
		{
			scope: [
				'entity.name.function',
				'support.function',
				'meta.function-call',
			],
			settings: {
				foreground: '#c473fc',
			},
		},
		{
			scope: [
				'variable',
				'variable.other',
				'entity.name.type',
				'support.type',
				'entity.name.class',
				'support.class',
			],
			settings: {
				foreground: '#47a8ff',
			},
		},
		{
			scope: [
				'constant',
				'constant.numeric',
				'constant.language',
				'variable.language.this',
			],
			settings: {
				foreground: '#A6B5FF',
			},
		},
		{
			scope: ['punctuation', 'meta.brace'],
			settings: {
				foreground: '#eeeeee',
			},
		},
		{
			scope: ['entity.name.tag', 'support.class.component'],
			settings: {
				foreground: '#ff4d8d',
			},
		},
		{
			scope: ['entity.other.attribute-name'],
			settings: {
				foreground: '#c473fc',
			},
		},
		{
			scope: ['variable.other.property', 'meta.object-literal.key'],
			settings: {
				foreground: '#eeeeee',
			},
		},
	],
};

export default vercelTheme;
