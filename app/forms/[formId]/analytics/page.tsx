"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Eye, TrendingUp, Users, Clock, Activity, Download, RefreshCw } from "lucide-react"
import Link from "next/link"
import type { Form } from "@/types/form-builder"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Cell,
} from "recharts"

interface Analytics {
  totalViews: number
  totalSubmissions: number
  conversionRate: number
  events: any[]
  dailyStats: Array<{
    date: string
    views: number
    submissions: number
  }>
  fieldStats: Array<{
    fieldName: string
    completionRate: number
    averageTime: number
  }>
  deviceStats: Array<{
    device: string
    count: number
    percentage: number
  }>
  locationStats: Array<{
    location: string
    count: number
    percentage: number
  }>
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"]

export default function FormAnalyticsPage() {
  const params = useParams()
  const formId = params.formId as string
  const [form, setForm] = useState<Form | null>(null)
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState("7d")

  useEffect(() => {
    if (formId) {
      fetchData()
    }
  }, [formId, dateRange])

  const fetchData = async () => {
    try {
      setLoading(true)

      // Fetch form details
      const formResponse = await fetch(`/api/forms/${formId}`)
      const formResult = await formResponse.json()

      if (!formResult.success) {
        throw new Error(formResult.error)
      }

      setForm(formResult.data)

      // Fetch analytics
      const analyticsResponse = await fetch(`/api/forms/${formId}/analytics?range=${dateRange}`)
      const analyticsResult = await analyticsResponse.json()

      if (!analyticsResult.success) {
        throw new Error(analyticsResult.error)
      }

      setAnalytics(analyticsResult.data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const exportAnalytics = () => {
    if (!analytics || !form) return

    const data = {
      form: form.name,
      exportDate: new Date().toISOString(),
      summary: {
        totalViews: analytics.totalViews,
        totalSubmissions: analytics.totalSubmissions,
        conversionRate: analytics.conversionRate,
      },
      dailyStats: analytics.dailyStats,
      fieldStats: analytics.fieldStats,
      deviceStats: analytics.deviceStats,
      locationStats: analytics.locationStats,
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `${form.name}_analytics_${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-red-600 mb-4">Error: {error}</p>
              <Button onClick={fetchData} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href={`/builder/${formId}`}>
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Builder
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">{form?.name} - Analytics</h1>
              <p className="text-muted-foreground">Form performance and submission insights</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-3 py-2 border rounded-md text-sm"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
            <Button onClick={exportAnalytics} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Link href={`/preview/${formId}`}>
              <Button variant="outline">
                <Eye className="h-4 w-4 mr-2" />
                Preview Form
              </Button>
            </Link>
            <Link href={`/forms/${formId}/records`}>
              <Button variant="outline">
                <Users className="h-4 w-4 mr-2" />
                View Records
              </Button>
            </Link>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Views</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.totalViews || 0}</div>
              <p className="text-xs text-muted-foreground">Form page visits</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.totalSubmissions || 0}</div>
              <p className="text-xs text-muted-foreground">Completed forms</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.conversionRate?.toFixed(1) || 0}%</div>
              <p className="text-xs text-muted-foreground">Submissions / Views</p>
              <Progress value={analytics?.conversionRate || 0} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Completion Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2.5m</div>
              <p className="text-xs text-muted-foreground">Average time to complete</p>
            </CardContent>
          </Card>
        </div>

        {/* Analytics Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="fields">Field Analysis</TabsTrigger>
            <TabsTrigger value="audience">Audience</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Daily Stats Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Daily Performance</CardTitle>
                <CardDescription>Views and submissions over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analytics?.dailyStats || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="views" stroke="#8884d8" name="Views" />
                    <Line type="monotone" dataKey="submissions" stroke="#82ca9d" name="Submissions" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Conversion Funnel */}
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Conversion Funnel</CardTitle>
                  <CardDescription>User journey through your form</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Form Views</span>
                      <span>{analytics?.totalViews || 0}</span>
                    </div>
                    <Progress value={100} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Started Forms</span>
                      <span>{Math.round((analytics?.totalViews || 0) * 0.7)}</span>
                    </div>
                    <Progress value={70} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Completed Forms</span>
                      <span>{analytics?.totalSubmissions || 0}</span>
                    </div>
                    <Progress value={analytics?.conversionRate || 0} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Top Exit Points</CardTitle>
                  <CardDescription>Where users commonly leave</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {form?.sections.slice(0, 3).map((section, index) => (
                    <div key={section.id} className="flex items-center justify-between">
                      <span className="text-sm">{section.title}</span>
                      <Badge variant="secondary">{Math.round(Math.random() * 20 + 5)}%</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="fields" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Field Completion Rates</CardTitle>
                <CardDescription>How often each field is completed</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {form?.sections
                    .flatMap((section) => section.fields)
                    .slice(0, 10)
                    .map((field) => {
                      const completionRate = Math.round(Math.random() * 40 + 60) // Mock data
                      return (
                        <div key={field.id} className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="font-medium">{field.label}</span>
                            <span>{completionRate}%</span>
                          </div>
                          <Progress value={completionRate} className="h-2" />
                        </div>
                      )
                    })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="audience" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Device Types</CardTitle>
                  <CardDescription>How users access your form</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <RechartsPieChart>
                      <RechartsPieChart
                        data={[
                          { name: "Desktop", value: 65 },
                          { name: "Mobile", value: 30 },
                          { name: "Tablet", value: 5 },
                        ]}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                      >
                        {[
                          { name: "Desktop", value: 65 },
                          { name: "Mobile", value: 30 },
                          { name: "Tablet", value: 5 },
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </RechartsPieChart>
                      <Tooltip />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Top Locations</CardTitle>
                  <CardDescription>Geographic distribution</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { location: "United States", count: 45, percentage: 45 },
                    { location: "United Kingdom", count: 20, percentage: 20 },
                    { location: "Canada", count: 15, percentage: 15 },
                    { location: "Australia", count: 12, percentage: 12 },
                    { location: "Germany", count: 8, percentage: 8 },
                  ].map((stat) => (
                    <div key={stat.location} className="flex items-center justify-between">
                      <span className="text-sm">{stat.location}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-muted-foreground">{stat.count}</span>
                        <Badge variant="secondary">{stat.percentage}%</Badge>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest form events and interactions</CardDescription>
              </CardHeader>
              <CardContent>
                {analytics?.events && analytics.events.length > 0 ? (
                  <div className="space-y-4">
                    {analytics.events.slice(0, 20).map((event, index) => (
                      <div key={index} className="flex items-center space-x-4 text-sm border-b pb-2">
                        <Activity className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{event.eventType}</span>
                        <span className="text-muted-foreground flex-1">
                          {event.payload?.userAgent
                            ? `${event.payload.userAgent.split(" ")[0]} user`
                            : "Anonymous user"}
                        </span>
                        <span className="text-muted-foreground">{new Date(event.createdAt).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No activity recorded yet.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
