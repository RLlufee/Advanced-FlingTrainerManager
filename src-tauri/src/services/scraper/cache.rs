use crate::models::PaginatedTrainers;
use std::sync::{LazyLock, Mutex};
use std::time::Instant;

pub static HOME_LIST_CACHE: LazyLock<Mutex<Option<(Instant, PaginatedTrainers)>>> =
    LazyLock::new(|| Mutex::new(None));
