'use strict';

module.exports = function rules (data) {
	data = data.replace(/<li[^>]+>/g, '<li>');

	data = data.replace(/<p[^>]+>/g, '<p>');

	data = data.replace(/<ul[^>]+>/g, '<ul>');

	data = data.replace(/<\/div>/g, '');

	data = data.replace(/<div[^>]+>/g, '');

	return data;
}
