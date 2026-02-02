---
hide:
  - navigation
---

<!-- Profile Picture and Title -->
<div class="landing-header">
  <img src="assets/images/my_avatar.jpg" alt="Profile Picture" class="profile-picture">
  <h1>Colter+</h1>
</div>

<!-- Project and External Links -->
<div class="link-buttons">
  <a href="projects/project1.md" class="project-button">Project 1</a>
  <a href="projects/project2.md" class="project-button">Project 2</a>
  <a href="https://github.com/colter-dahlberg" class="external-button" target="_blank">GitHub</a>
  <a href="https://www.linkedin.com/in/colter-dahlberg" class="external-button" target="_blank">LinkedIn</a>
</div>

<!-- Recent Blog Posts -->
## Recent Blog Posts

<div class="blog-posts">
  {% for post in blog.posts | selectattr("date", "<=", today) | sort(attribute="date", reverse=true) | map(attribute="url") | list[:3] %}
    <a href="{{ post.url }}" class="blog-post-link">
      <div class="blog-post">
        <div class="blog-post-title">
          <h3>{{ post.title }}</h3>
        </div>
        <div class="blog-post-date">
          <p>{{ post.date | format_date(date_format="%B %d, %Y") }}</p>
        </div>
      </div>
    </a>
  {% endfor %}
</div>