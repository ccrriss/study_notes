# syntax=docker/dockerfile:1

# Comments are provided throughout this file to help you get started.
# If you need more help, visit the Dockerfile reference guide at
# https://docs.docker.com/go/dockerfile-reference/

# Want to help us make this template better? Share your feedback here: https://forms.gle/ybq9Krt8jtBL3iCk7

ARG PYTHON_VERSION=3.11.9
FROM python:${PYTHON_VERSION}-slim as base

# install UV first
COPY --from=ghcr.io/astral-sh/uv:0.12.5 /uv /uvx /bin/

# Prevents Python from writing pyc files.
ENV PYTHONDONTWRITEBYTECODE=1

# Keeps Python from buffering stdout and stderr to avoid situations where
# the application crashes without emitting any logs due to buffering.
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Create a non-privileged user that the app will run under.
# See https://docs.docker.com/go/dockerfile-user-best-practices/
ARG UID=10001
RUN adduser \
    --disabled-password \
    --gecos "" \
    --home "/home/appuser" \
    --shell "/sbin/nologin" \
    --uid "${UID}" \
    appuser

# Install dependencies
RUN --mount=type=cache,target=/root/.cache/uv \
    --mount=type=bind,source=uv.lock,target=uv.lock \
    --mount=type=bind,source=pyproject.toml,target=pyproject.toml \
    uv sync --locked --no-install-project

# Switch to the non-privileged user to run the application.
USER appuser

# Copy the project into the image
COPY . /app

# Sync the project
# temp commented for checking whether it will affect the start of the project
# RUN --mount=type=cache,target=/root/.cache/uv \
#     uv sync --locked

# Expose the port that the application listens on.
EXPOSE 8000

# Run the application.
# CMD uv run uvicorn app.main:app --host 0.0.0.0 --port 8000
# Test for no sync
CMD uv run --no-sync uvicorn app.main:app --host 0.0.0.0 --port 8000
