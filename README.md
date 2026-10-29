# RailConnect India — RailKit API Website

A responsive Indian Railways enquiry website with a Vercel serverless proxy for RailKit. The API key is kept on the server.

## Included tools
- PNR status
- Live train status (V1)
- Train information / route
- Trains between stations
- Seat availability
- Fare enquiry
- Search train by number/prefix
- Search train by name
- Train history
- Cancelled trains
- Live station board (2/4/8 hours)
- Station details by code
- Search station by name
- Station amenities
- Station timetable

## Deploy on Vercel
1. Extract this ZIP and upload the folder to a GitHub repository.
2. Import the repository into Vercel.
3. In **Vercel → Project → Settings → Environment Variables**, add:
   - Name: `RAILKIT_API_KEY`
   - Value: your key from https://railkit.in/
   - Environment: Production (and Preview/Development if required)
4. Redeploy the project.
5. Open the deployed website and test a tool.

No npm dependencies are required. `index.html` is the frontend and `api/railkit.js` is the serverless proxy.

## Local preview
You can open `index.html` to preview the interface, but API requests need a Vercel-compatible local runtime or deployment because `/api/railkit` is a serverless endpoint. Do not place the RailKit key in `index.html`.

## API details
- Provider base URL: `https://api.railkit.in`
- Authentication header: `x-api-key`
- Date inputs use `DD-MM-YYYY`.
- Some endpoints may require an eligible RailKit plan or have request limits.
- Verify critical travel details with official railway sources. Live train location is a provider estimate, not GPS.
- This is an independent interface and is not affiliated with Indian Railways.

## Security
The proxy only accepts a whitelist of supported actions, validates user inputs, and reads the key from the server environment. Never commit your API key to GitHub or put it into frontend code.
