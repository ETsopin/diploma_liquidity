'use client'

import { useState } from 'react';

export default function TimebucketsChart() {
	const [data, setData] = useState(null);
	const [loading, SetLoading] = useState<boolean>(true);
	const [error, SetError] = useState<string | null>(null);


	return (
		<>
			{`${data}`}
		</>
	);
}
