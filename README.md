# Nexion

Nexion is a collaborative social platform that combines interactive mind maps with ML-powered content analysis. Users share knowledge through posts organized in mind maps, while semantic classification ensures content relevance across communities. Developed as a capstone project for the IT course at COTUCA.

## Technical Highlights

- ML-powered topic matching: post classification using a multilingual embeddings model via SentenceTransformers to automatically validate post relevance to communities
- Mind-mapping post integration: custom integration of the mind-elixir library and Quill rich text editor

## Main Features Showcase

https://github.com/user-attachments/assets/60522883-16b5-4f5d-8794-cf3ce305ab9a

## Group Members

- Felipe Horacio Mateu - Scrum Master/Developer
- Miguel Rybaltowski Marion - Product Owner/Developer
- Rafael de Oliveira Cançado - Developer

## Tech Stack

- Frontend: Next.js, React, TypeScript, Tailwind CSS
- Backend: NestJS, TypeScript, Prisma

The libraries used for the mind mapping feature are [mind-elixir](https://docs.mind-elixir.com/) and [Quill](https://quilljs.com/), which are integrated using a posts system with a custom mind-elixir context menu.

For the "topic match" feature, initially a topic-modelling unsupervised learning approach was implemented using LDA, but was later replaced by an embedding-based semantic classification technique using an existing [model](https://huggingface.co/intfloat/multilingual-e5-base) via [SentenceTransformers](https://www.sbert.net/).

## Running the Project Locally

Start by cloning the repository:

```bash
$ git clone https://github.com/miguelrmarion/nexion.git
```

Install the Node.js dependencies for the backend:

```bash
$ cd nexion/backend
$ npm install
```

For the topic matching service, create a Python venv and install the required dependencies:

```bash
$ cd src/topic-matching
$ python -m venv .venv
$ source .venv/bin/activate # Or equivalent for your OS

# Install your desired PyTorch compute platform: https://pytorch.org/get-started/locally/
$ pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu

$ pip install sentence-transformers scikit-learn
```

Then start the server, still with the venv activated:

```bash
$ npm run start:dev
```

In a separate terminal, install the dependencies for the frontend and start the Next.js development server:

```bash
$ cd nexion/frontend
$ npm install
$ npm run dev
```

By default the site will be available at `http://localhost:3000`.

## Docker Deployment

To deploy the project using Docker, build the front-end and back-end Docker images and start the containers using Docker Compose:

```bash
$ docker compose build
$ docker compose up -d
```

## Tests

To run the tests for the backend, run the Jest script:

```bash
$ cd nexion/backend
$ npm run test
```
