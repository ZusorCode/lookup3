import axios from "axios";
/**
 * @type {import('@sveltejs/kit').RequestHandler}
 */
export async function post({body}) {
	const bnet = body.bnet;
	if (!bnet) {
		return {
			body: {
				success: false,
				bnet,
				error: "No bnet provided"
			}
		}
	}

	const encodedBnet = encodeURIComponent(bnet.replace("#", "-"));
	try {
		const playerResponse = await axios.get(`https://ow-api.com/v3/stats/pc/${encodedBnet}/profile`);
		return {
			body: {
				success: true,
				bnet,
				wasFixed: false,
				playerData: playerResponse.data
			}
		}
	} catch (e) {
		const bnetFixResults = await Promise.all([
			axios.get(encodeURI(`https://playoverwatch.com/en-us/search/account-by-name/${bnet.replace("#", "%23")}`)),
			axios.get(encodeURI(`https://playoverwatch.com/en-us/search/account-by-name/${bnet.split("#")[0]}`))
		])

		let fixedBnet = ""

		for (const bnetFixResult of bnetFixResults) {
			if (bnetFixResult) {
				const filteredBnetFixData = bnetFixResult.data.filter((e) => e.platform === "pc");
				if (filteredBnetFixData.length === 1) {
					fixedBnet = bnetFixResult.data[0].name
				}
			}
		}

		if (!fixedBnet) {
			return {
				body: {
					bnet,
					success: false,
					error: "Unfixable bnet"
				}
			}
		}

		const encodedFixedBnet = encodeURIComponent(fixedBnet.replace("#", "-"));
		try {
			const fixedPlayerResponse = await axios.get(`https://ow-api.com/v3/stats/pc/${encodedFixedBnet}/profile`);
			return {
				body: {
					success: true,
					wasFixed: true,
					bnet,
					fixedBnet: fixedBnet,
					playerData: fixedPlayerResponse.data
				}
			}
		} catch (e) {
			return {
				body: {
					success: false,
					error: "Fixed bnet invalid"
				}
			}
		}
	}
}
