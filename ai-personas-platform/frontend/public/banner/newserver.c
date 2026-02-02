#include <errno.h>
#include <string.h>
#include <unistd.h>
#include <stdio.h>
#include <stdlib.h>
#include <netdb.h>
#include <sys/socket.h>
#include <sys/select.h>
#include <netinet/in.h>

int extract_message(char **buf, char **msg)
{
	char *newbuf;
	int i;

	*msg = 0;
	if (*buf == 0)
		return (0);
	i = 0;
	while ((*buf)[i])
	{
		if ((*buf)[i] == '\n')
		{
			newbuf = calloc(1, sizeof(*newbuf) * (strlen(*buf + i + 1) + 1));
			if (newbuf == 0)
				return (-1);
			strcpy(newbuf, *buf + i + 1);
			*msg = *buf;
			(*msg)[i + 1] = 0;
			*buf = newbuf;
			return (1);
		}
		i++;
	}
	return (0);
}

char *str_join(char *buf, char *add)
{
	char *newbuf;
	int len;

	if (buf == 0)
		len = 0;
	else
		len = strlen(buf);
	newbuf = malloc(sizeof(*newbuf) * (len + strlen(add) + 1));
	if (newbuf == 0)
		return (0);
	newbuf[0] = 0;
	if (buf != 0)
		strcat(newbuf, buf);
	free(buf);
	strcat(newbuf, add);
	return (newbuf);
}

int sockfd, maxfd;
int count = 0;
struct sockaddr_in servaddr, cli;
int ids[700000];
char *msgs[700000];
char buf_read[7001], buf_write[42];
fd_set curr_sock, cpy_read, cpy_write;

void fatal()
{
	write(2, "Fatal error\n", strlen("Fatal error\n"));
	exit(1);
}

void notify(int clfd, char *new_msg)
{
	for (int fd = 0; fd <= maxfd; fd++)
	{
		if (clfd != fd && FD_ISSET(fd, &cpy_write))
			send(fd, new_msg, strlen(new_msg), 0);
	}
}

void add_client(int fd)
{
	maxfd = maxfd > fd ? maxfd : fd;
	ids[fd] = count++;
	msgs[fd] = NULL;
	sprintf(buf_write, "server: client %d just arrived\n", ids[fd]);
	notify(fd, buf_write);
	FD_SET(fd, &curr_sock);
}

void rm_client(int fd)
{
	sprintf(buf_write, "server: client %d just left\n", ids[fd]);
	notify(fd, buf_write);
	if (msgs[fd])
		free(msgs[fd]);
	FD_CLR(fd, &curr_sock);
	close(fd);
}

void send_msg(int fd)
{
	char *msg;
	while (extract_message(&(msgs[fd]), &msg))
	{
		sprintf(buf_write, "client %d: ", ids[fd]);
		notify(fd, buf_write);
		notify(fd, msg);
		free(msg);
	}
}

int main(int ac, char *av[])
{
	if (ac != 2)
	{
		write(2, "Wrong number of arguments\n", strlen("Wrong number of arguments\n"));
		exit(1);
	}
	if ((sockfd = socket(AF_INET, SOCK_STREAM, 0)) == -1)
		fatal();
	maxfd = sockfd;
	bzero(&servaddr, sizeof(servaddr));
	servaddr.sin_family = AF_INET;
	servaddr.sin_addr.s_addr = htonl(2130706433); // 127.0.0.1
	servaddr.sin_port = htons(atoi(av[1]));
	if ((bind(sockfd, (const struct sockaddr *)&servaddr, sizeof(servaddr))) != 0)
		fatal();
	if (listen(sockfd, SOMAXCONN) != 0)
		fatal();
	FD_ZERO(&curr_sock);
	FD_SET(sockfd, &curr_sock);
	while (1)
	{
		cpy_read = cpy_write = curr_sock;
		if (select(maxfd + 1, &cpy_read, &cpy_write, NULL , NULL) < 0)
			fatal();
		for (int fd = 0; fd <= maxfd; fd++)
		{
			if (!FD_ISSET(fd, &cpy_read))
				continue;
			if (fd == sockfd)
			{
				socklen_t len = sizeof(cli);
				int clientfd = accept(sockfd, (struct sockaddr *)&cli, &len);
				if (clientfd >= 0)
				{
					add_client(clientfd);
					break;
				}
			}
			else
			{
				int ret = recv(fd, buf_read, 1000, 0);
				if (ret <= 0)
				{
					rm_client(fd);
					break;
				}
				buf_read[ret] = '\0';
				msgs[fd] = str_join(msgs[fd], buf_read);
				send_msg(fd);
			}
		}
	}
	return 0;
}