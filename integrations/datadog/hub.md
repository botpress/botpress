The Datadog Integration allows you to seamlessly interact with Datadog within your Botpress bot. This integration provides various actions to query metrics and create events, enhancing the monitoring and observability capabilities of your bot.

## Configuration

### Getting your Datadog API credentials

To use this integration, you need to obtain your Datadog API key and Application key:

1. Log in to your Datadog account.
2. Navigate to **Organization Settings** > **API Keys**.
3. Create a new API key or copy an existing one.
4. Navigate to **Organization Settings** > **Application Keys**.
5. Create a new Application key or copy an existing one.

> **Note:** The Application key is required for most Datadog API operations. Make sure to keep both keys secure.

### Configuring the Datadog site

Datadog has multiple sites depending on your region:

- `datadoghq.com` - US1 (default)
- `us3.datadoghq.com` - US3
- `us5.datadoghq.com` - US5
- `ap1.datadoghq.com` - AP1
- `eu.datadoghq.com` - EU

If you're not using the US1 site, make sure to specify your site in the configuration.

### Configuring the integration

1. Install this integration in your bot with the following configuration:
   - **API Key**: Your Datadog API key
   - **Application Key**: Your Datadog Application key
   - **Site** (optional): Your Datadog site (defaults to `datadoghq.com`)

## Usage

Once the Datadog Integration is configured, you can use it to monitor metrics and create events within your Botpress bot. Here are some common use cases:

- Query time-series metrics to monitor system performance.
- Create events in Datadog based on bot interactions or system alerts.
- Monitor application health and performance metrics.
- Track custom business metrics and KPIs.

The integration provides powerful capabilities to enhance your bot's monitoring and observability functionalities.

### Querying metrics

The `queryMetrics` action allows you to query time-series metrics from Datadog. You can use Datadog's query language to filter and aggregate metrics.

**Example query:**
```
avg:system.cpu.user{*}
```

This query returns the average CPU user time across all hosts.

**Query syntax:**
- `avg:metric.name{*}` - Average of a metric across all tags
- `sum:metric.name{env:production}` - Sum of a metric filtered by tags
- `max:metric.name{host:web-*} by {host}` - Maximum value grouped by host

For more information on Datadog query syntax, refer to the [Datadog documentation](https://docs.datadoghq.com/dashboards/querying/).

### Creating events

The `createEvent` action allows you to create events in Datadog. Events can be used to track important occurrences, alerts, or custom business events.

**Event properties:**
- `title` (required): Title of the event
- `text` (required): Text body of the event
- `priority`: Priority level (`normal` or `low`)
- `alertType`: Type of event (`error`, `warning`, `info`, `success`, etc.)
- `tags`: Array of tags to associate with the event
- `host`: Host name to associate with the event
- `source`: Source type name (e.g., `user`, `my apps`, `feed`)

**Example:**
```json
{
  "title": "User Registration",
  "text": "A new user has registered in the system",
  "priority": "normal",
  "alertType": "info",
  "tags": ["user", "registration"],
  "host": "web-server-01"
}
```

## Limitations

- Rate limiting: Datadog has rate limits that vary by plan. Check your plan's limits to avoid exceeding them.
- Query complexity: Complex metric queries may take longer to execute.
- Historical data: The amount of historical data available depends on your Datadog plan.
- Event retention: Events are retained according to your Datadog plan's retention policy.

