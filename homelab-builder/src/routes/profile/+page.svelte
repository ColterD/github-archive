<!-- HOMELAB HARDWARE PLATFORM - USER PROFILE PAGE -->
<script lang="ts">
  import { Button } from "$lib/components/ui/button"
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "$lib/components/ui/card"
  import { Badge } from "$lib/components/ui/badge"
  import { 
    User, 
    Mail, 
    Calendar, 
    Shield, 
    Star, 
    Award, 
    TrendingUp, 
    Edit, 
    Settings,
    Heart,
    MessageSquare,
    Building,
    Search
  } from "lucide-svelte"
  import { onMount } from "svelte"
  
  export let data
  $: session = data.session
  
  // Mock user data - will be replaced with real data
  let userStats = {
    totalBuilds: 12,
    totalReviews: 34,
    totalFavorites: 67,
    reputationScore: 850,
    joinedDate: "January 2024",
    lastActive: "2 hours ago"
  }
  
  let recentActivity = [
    { type: "build", title: "Dell PowerEdge R720 Homelab Setup", date: "2 days ago" },
    { type: "review", title: "Review: HP ProLiant DL380 G9", date: "1 week ago" },
    { type: "favorite", title: "Added to favorites: Cisco ASA 5506-X", date: "1 week ago" },
  ]
  
  onMount(() => {
    // Load user profile data
    if (!session?.user) {
      window.location.href = "/auth/signin"
    }
  })
</script>

<svelte:head>
  <title>Profile - {session?.user?.name || 'User'} | Homelab Hardware Platform</title>
  <meta name="description" content="User profile and account management" />
</svelte:head>

{#if session?.user}
  <div class="container mx-auto px-4 py-8 max-w-6xl">
    <!-- Profile Header -->
    <div class="mb-8">
      <div class="flex flex-col md:flex-row items-start md:items-center gap-6">
        <!-- Avatar and Basic Info -->
        <div class="flex items-center gap-4">
          {#if session.user.image}
            <img 
              src={session.user.image} 
              alt={session.user.name || 'User'} 
              class="w-20 h-20 rounded-full border-2 border-border"
            />
          {:else}
            <div class="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
              <User class="w-8 h-8 text-muted-foreground" />
            </div>
          {/if}
          
          <div>
            <h1 class="text-3xl font-bold">{session.user.name || 'User'}</h1>
            {#if session.user.username}
              <p class="text-muted-foreground">@{session.user.username}</p>
            {/if}
            {#if session.user.role}
              <Badge variant="secondary" class="mt-2">
                <Shield class="w-3 h-3 mr-1" />
                {session.user.role}
              </Badge>
            {/if}
          </div>
        </div>
        
        <!-- Action Buttons -->
        <div class="flex gap-3 ml-auto">
          <Button variant="outline" size="sm">
            <Edit class="w-4 h-4 mr-2" />
            Edit Profile
          </Button>
          <Button variant="outline" size="sm">
            <Settings class="w-4 h-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>
    </div>
    
    <!-- Stats Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <Card>
        <CardContent class="p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-muted-foreground">Builds Created</p>
              <p class="text-2xl font-bold">{userStats.totalBuilds}</p>
            </div>
            <Building class="w-8 h-8 text-blue-500" />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent class="p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-muted-foreground">Reviews Written</p>
              <p class="text-2xl font-bold">{userStats.totalReviews}</p>
            </div>
            <MessageSquare class="w-8 h-8 text-green-500" />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent class="p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-muted-foreground">Favorites</p>
              <p class="text-2xl font-bold">{userStats.totalFavorites}</p>
            </div>
            <Heart class="w-8 h-8 text-red-500" />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent class="p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-muted-foreground">Reputation</p>
              <p class="text-2xl font-bold">{userStats.reputationScore}</p>
            </div>
            <Award class="w-8 h-8 text-yellow-500" />
          </div>
        </CardContent>
      </Card>
    </div>
    
    <!-- Main Content Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Account Information -->
      <div class="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle class="flex items-center gap-2">
              <User class="w-5 h-5" />
              Account Information
            </CardTitle>
            <CardDescription>
              Your account details and verification status
            </CardDescription>
          </CardHeader>
          <CardContent class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p class="text-sm font-medium text-muted-foreground">Email</p>
                <div class="flex items-center gap-2 mt-1">
                  <Mail class="w-4 h-4 text-muted-foreground" />
                  <span>{session.user?.email}</span>
                  <Badge variant="outline" class="text-xs">Verified</Badge>
                </div>
              </div>
              
              <div>
                <p class="text-sm font-medium text-muted-foreground">Member Since</p>
                <div class="flex items-center gap-2 mt-1">
                  <Calendar class="w-4 h-4 text-muted-foreground" />
                  <span>{userStats.joinedDate}</span>
                </div>
              </div>
              
              <div>
                <p class="text-sm font-medium text-muted-foreground">Last Active</p>
                <div class="flex items-center gap-2 mt-1">
                  <TrendingUp class="w-4 h-4 text-muted-foreground" />
                  <span>{userStats.lastActive}</span>
                </div>
              </div>
              
              <div>
                <p class="text-sm font-medium text-muted-foreground">Account Status</p>
                <div class="flex items-center gap-2 mt-1">
                  <Shield class="w-4 h-4 text-green-500" />
                  <Badge variant="secondary">{session.user?.status || 'Active'}</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <!-- Recent Activity -->
        <Card>
          <CardHeader>
            <CardTitle>
              Recent Activity
            </CardTitle>
            <CardDescription>
              Your latest contributions and interactions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div class="space-y-4">
              {#each recentActivity as activity (activity.title)}
                <div class="flex items-center gap-3 p-3 rounded-lg border">
                  {#if activity.type === 'build'}
                    <Building class="w-5 h-5 text-blue-500" />
                  {:else if activity.type === 'review'}
                    <MessageSquare class="w-5 h-5 text-green-500" />
                  {:else if activity.type === 'favorite'}
                    <Heart class="w-5 h-5 text-red-500" />
                  {/if}
                  <div class="flex-1">
                    <p class="font-medium">{activity.title}</p>
                    <p class="text-sm text-muted-foreground">{activity.date}</p>
                  </div>
                </div>
              {/each}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <!-- Sidebar -->
      <div class="space-y-6">
        <!-- Achievements -->
        <Card>
          <CardHeader>
            <CardTitle class="flex items-center gap-2">
              <Star class="w-5 h-5" />
              Achievements
            </CardTitle>
          </CardHeader>
          <CardContent class="space-y-3">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                <Award class="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p class="font-medium">First Build</p>
                <p class="text-sm text-muted-foreground">Created your first build</p>
              </div>
            </div>
            
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                <MessageSquare class="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p class="font-medium">Helpful Reviewer</p>
                <p class="text-sm text-muted-foreground">10+ helpful reviews</p>
              </div>
            </div>
            
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center">
                <TrendingUp class="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p class="font-medium">Rising Star</p>
                <p class="text-sm text-muted-foreground">500+ reputation</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <!-- Quick Actions -->
        <Card>
          <CardHeader>
            <CardTitle>
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent class="space-y-2">
            <Button variant="outline" class="w-full justify-start">
              <Building class="w-4 h-4 mr-2" />
              Create New Build
            </Button>
            <Button variant="outline" class="w-full justify-start">
               <MessageSquare class="w-4 h-4 mr-2" />
               Write Review
             </Button>
             <Button variant="outline" class="w-full justify-start">
               <Search class="w-4 h-4 mr-2" />
               Browse Hardware
             </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
{:else}
  <div class="min-h-screen flex items-center justify-center">
    <Card class="w-full max-w-md">
      <CardContent class="pt-6">
        <div class="text-center space-y-4">
          <User class="w-12 h-12 mx-auto text-muted-foreground" />
          <h2 class="text-xl font-semibold">Sign in required</h2>
          <p class="text-muted-foreground">You need to sign in to view your profile.</p>
          <Button onclick={() => window.location.href = '/auth/signin'}>
            Sign In
          </Button>
        </div>
      </CardContent>
    </Card>
  </div>
{/if}