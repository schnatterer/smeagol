package com.cloudogu.smeagol.wiki.infrastructure;

import com.cloudogu.smeagol.wiki.domain.*;
import com.google.common.base.Charsets;
import com.google.common.base.Throwables;
import com.google.common.io.Files;
import org.eclipse.jgit.api.errors.GitAPIException;
import org.eclipse.jgit.errors.InvalidObjectIdException;
import org.eclipse.jgit.errors.MissingObjectException;
import org.eclipse.jgit.revwalk.RevCommit;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.util.Optional;

@Service
public class ScmGitPageRepository implements PageRepository {

    private static final Logger LOG = LoggerFactory.getLogger(ScmGitPageRepository.class);

    private final GitClientProvider gitClientProvider;

    @Autowired
    public ScmGitPageRepository(GitClientProvider gitClientProvider) {
        this.gitClientProvider = gitClientProvider;
    }

    @Override
    public Optional<Page> findByWikiIdAndPath(WikiId id, Path path) {
        try (GitClient client = gitClientProvider.createGitClient(id)) {
            client.refresh();
            return createPageFromFile(client, id, path);
        } catch (IOException | GitAPIException ex) {
            throw Throwables.propagate(ex);
        }
    }

    private Optional<Page> createPageFromFile(GitClient client, WikiId id, Path path) throws IOException, GitAPIException {
        String pagePath = Pages.filepath(path);
        File file = client.file(pagePath);

        Optional<Page> page = Optional.empty();
        if (file.exists()) {
            page = createPageFromFile(client, id, path, pagePath, file);
        }

        return page;
    }

    private Optional<Page> createPageFromFile(GitClient client, WikiId id, Path path, String pagePath, File file) throws IOException, GitAPIException {
        Optional<RevCommit> optCommit = client.lastCommit(pagePath);
        if (optCommit.isPresent()) {
            Content content = createContent(file);
            Commit commit = ScmGit.createCommit(optCommit.get());

            return Optional.of(new Page(id, path, content, commit));
        }
        return Optional.empty();
    }

    @Override
    public Optional<Page> findByWikiIdAndPathAndCommit(WikiId wikiId, Path path, CommitId commitId) {
        try (GitClient client = gitClientProvider.createGitClient(wikiId)) {
            client.refresh();
            return createPageFromFileAtCommit(client, wikiId, path, commitId);
        } catch (InvalidObjectIdException ex) {
            throw new MalformedCommitIdException(commitId, ex);
        } catch (MissingObjectException ex) {
            LOG.debug("Catch MissingObjectException and return empty page", ex);
            return Optional.empty();
        } catch (IOException | GitAPIException ex) {
            throw Throwables.propagate(ex);
        }
    }

    private Optional<Page> createPageFromFileAtCommit(GitClient client, WikiId wikiId, Path path, CommitId commitId) throws IOException {
        RevCommit revCommit = client.getCommitFromId(commitId.getValue());
        Optional<String> optFileContent = client.pathContentAtCommit(Pages.filepath(path), revCommit);
        return optFileContent
                .map(Content::valueOf)
                .map(c -> createPage(wikiId, path, revCommit, c));
    }

    public void delete(Page page, Commit commit) {
        WikiId id = page.getWikiId();
        Path path = page.getPath();
        try (GitClient client = gitClientProvider.createGitClient(id)) {
            client.refresh();

            String pagePath = Pages.filepath(path);
            File file = client.file(pagePath);
            if (!file.delete()) {
                throw new IOException("could not delete file: " + file.getPath());
            }

            Author author = commit.getAuthor();

            client.commit(
                    pagePath,
                    author.getDisplayName().getValue(),
                    author.getEmail().getValue(),
                    commit.getMessage().getValue()
            );

        } catch (IOException | GitAPIException ex) {
            throw Throwables.propagate(ex);
        }
    }

    private Content createContent(File file) throws IOException {
        return Content.valueOf(Files.toString(file, Charsets.UTF_8));
    }

    @Override
    public Page save(Page page) {
        if (page.getOldPath().isPresent()) {
            return move(page);
        }
        return createOrEdit(page);
    }

    private Page createOrEdit(Page page) {
        WikiId id = page.getWikiId();
        Path path = page.getPath();
        try (GitClient client = gitClientProvider.createGitClient(id)) {
            client.refresh();

            String pagePath = Pages.filepath(path);
            File file = client.file(pagePath);
            mkdirs(file.getParentFile());
            Content content = page.getContent();
            Files.write(content.getValue(), file, Charsets.UTF_8);

            Commit commit = page.getCommit().get();
            Author author = commit.getAuthor();

            RevCommit revCommit = client.commit(
                    pagePath,
                    author.getDisplayName().getValue(),
                    author.getEmail().getValue(),
                    commit.getMessage().getValue()
            );

            return createPage(page.getWikiId(), path, revCommit, content);
        } catch (IOException | GitAPIException ex) {
            throw Throwables.propagate(ex);
        }
    }

    private Page createPage(WikiId wikiId, Path path, RevCommit revCommit, Content content) {
        return new Page(wikiId, path, content, ScmGit.createCommit(revCommit));
    }

    private Page move(Page page) {
        WikiId id = page.getWikiId();
        Path oldPath = page.getOldPath().get();
        Commit commit = page.getCommit().get();

        try (GitClient client = gitClientProvider.createGitClient(id)) {
            client.refresh();

            String sourcePath = Pages.filepath(oldPath);
            String targetPath = Pages.filepath(page.getPath());
            File oldFile = client.file(sourcePath);
            File newFile = client.file(targetPath);
            mkdirs(newFile.getParentFile());
            Files.move(oldFile, newFile);

            Author author = commit.getAuthor();

            String[] paths = {sourcePath, targetPath};
            RevCommit revCommit = client.commit(
                    paths,
                    author.getDisplayName().getValue(),
                    author.getEmail().getValue(),
                    commit.getMessage().getValue()
            );

            return new Page(id, Pages.pagepath(targetPath), Pages.pagepath(sourcePath), page.getContent(), ScmGit.createCommit(revCommit));
        } catch (IOException | GitAPIException ex) {
            throw Throwables.propagate(ex);
        }
    }

    private void mkdirs(File directory) throws IOException {
        if(!directory.mkdirs() && !directory.exists()) {
            throw new IOException("could not create directory: " + directory.getPath());
        }
    }

    @Override
    public boolean exists(WikiId id, Path path) {
        try (GitClient client = gitClientProvider.createGitClient(id)) {
            String pagePath = Pages.filepath(path);
            return client.file(pagePath).exists();
        }
    }
}
